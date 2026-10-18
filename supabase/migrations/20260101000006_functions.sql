-- 0006: Trusted server-side functions (price recomputation, RPCs)
-- All functions pin search_path and validate inputs. Prices, totals, and
-- status are NEVER trusted from the client.

create or replace function public.is_valid_transition(
  p_from public.order_status,
  p_to public.order_status
)
returns boolean
language sql
immutable
as $$
  select case p_from
    when 'pending' then p_to in ('accepted', 'cancelled')
    when 'accepted' then p_to in ('preparing', 'cancelled')
    when 'preparing' then p_to in ('ready', 'cancelled')
    when 'ready' then p_to in ('served', 'cancelled')
    else false
  end
$$;

create or replace function public.log_audit(
  p_action text,
  p_entity text,
  p_entity_id text,
  p_meta jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  select full_name into v_name from public.profiles where id = auth.uid();
  insert into public.audit_logs (action, entity, entity_id, actor_id, actor_name, meta)
  values (p_action, p_entity, p_entity_id, auth.uid(), v_name, p_meta);
end;
$$;

-- Build the full order JSON shape expected by the app (OrderWithItems).
create or replace function public.order_to_json(p_order_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', o.id,
    'reference', o.reference,
    'tracking_token', o.tracking_token,
    'table_id', o.table_id,
    'table_label', o.table_label,
    'customer_name', o.customer_name,
    'customer_phone', o.customer_phone,
    'notes', o.notes,
    'status', o.status,
    'payment_status', o.payment_status,
    'payment_method', o.payment_method,
    'subtotal', o.subtotal,
    'tax_total', o.tax_total,
    'discount_total', o.discount_total,
    'total', o.total,
    'currency', o.currency,
    'placed_at', o.placed_at,
    'updated_at', o.updated_at,
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'order_id', i.order_id,
          'menu_item_id', i.menu_item_id,
          'name_snapshot', i.name_snapshot,
          'variant_name', i.variant_name,
          'unit_price', i.unit_price,
          'quantity', i.quantity,
          'line_total', i.line_total,
          'notes', i.notes,
          'modifiers', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', m.id,
                'order_item_id', m.order_item_id,
                'group_name', m.group_name,
                'option_name', m.option_name,
                'price_delta', m.price_delta
              ) order by m.id
            )
            from public.order_item_modifiers m
            where m.order_item_id = i.id
          ), '[]'::jsonb)
        ) order by i.id
      )
      from public.order_items i
      where i.order_id = o.id
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'order_id', e.order_id,
          'status', e.status,
          'note', e.note,
          'created_by', e.created_by,
          'created_at', e.created_at
        ) order by e.created_at
      )
      from public.order_status_events e
      where e.order_id = o.id
    ), '[]'::jsonb),
    'payments', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'order_id', p.order_id,
          'method', p.method,
          'status', p.status,
          'amount', p.amount,
          'reference', p.reference,
          'confirmed_by', p.confirmed_by,
          'confirmed_at', p.confirmed_at,
          'created_at', p.created_at
        ) order by p.created_at
      )
      from public.payments p
      where p.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  where o.id = p_order_id
$$;

-- Customer-facing: resolve an active table by its QR token.
create or replace function public.resolve_table_by_token(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_table public.cafe_tables;
begin
  if p_token is null or length(trim(p_token)) < 12 then
    return null;
  end if;
  select * into v_table
  from public.cafe_tables
  where token = trim(p_token) and is_active
  limit 1;
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'id', v_table.id,
    'label', v_table.label,
    'token', v_table.token,
    'seats', v_table.seats,
    'zone', v_table.zone,
    'is_active', v_table.is_active,
    'created_at', v_table.created_at
  );
end;
$$;

-- Customer-facing: create an order. Recomputes every price server-side.
create or replace function public.create_order(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.cafe_settings;
  v_table public.cafe_tables;
  v_items jsonb;
  v_item jsonb;
  v_menu_item public.menu_items;
  v_variant public.menu_item_variants;
  v_group record;
  v_group_count integer;
  v_option record;
  v_option_id uuid;
  v_qty integer;
  v_unit numeric(10, 2);
  v_line numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
  v_tax numeric(10, 2) := 0;
  v_total numeric(10, 2) := 0;
  v_method public.payment_method := 'counter';
  v_order_id uuid;
  v_order_item_id uuid;
  v_selected jsonb;
  v_reference text;
  v_token text;
begin
  select * into v_settings from public.cafe_settings where id = 'default';
  if v_settings.accepting_orders is false then
    raise exception 'The cafe is not accepting new orders right now.';
  end if;

  v_items := coalesce(p_payload -> 'items', '[]'::jsonb);
  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;
  if jsonb_array_length(v_items) > 50 then
    raise exception 'This order has too many distinct items.';
  end if;

  if p_payload ->> 'payment_method' = 'upi' then
    v_method := 'upi';
  end if;

  if coalesce(p_payload ->> 'table_token', '') <> '' then
    select * into v_table
    from public.cafe_tables
    where token = p_payload ->> 'table_token' and is_active
    limit 1;
    if not found then
      raise exception 'This table link is no longer valid.';
    end if;
  end if;

  v_token := upper(encode(gen_random_bytes(20), 'hex'));
  v_reference := 'BB-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 5));

  insert into public.orders (
    reference, tracking_token, table_id, table_label,
    customer_name, customer_phone, notes,
    status, payment_status, payment_method, currency
  ) values (
    v_reference, v_token, v_table.id, v_table.label,
    nullif(trim(coalesce(p_payload ->> 'customer_name', '')), ''),
    nullif(trim(coalesce(p_payload ->> 'customer_phone', '')), ''),
    nullif(trim(coalesce(p_payload ->> 'notes', '')), ''),
    'pending',
    case when v_method = 'upi' then 'pending'::public.payment_status
         else 'unpaid'::public.payment_status end,
    v_method,
    coalesce(v_settings.currency, 'INR')
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(v_items)
  loop
    v_qty := greatest(1, least(100, coalesce((v_item ->> 'quantity')::int, 1)));

    select * into v_menu_item
    from public.menu_items
    where id = (v_item ->> 'menu_item_id')::uuid
    limit 1;
    if not found then
      raise exception 'An item in your cart is no longer on the menu.';
    end if;
    if v_menu_item.is_available is false then
      raise exception 'Item "%" is currently sold out.', v_menu_item.name;
    end if;

    v_unit := v_menu_item.base_price;

    if coalesce(v_item ->> 'variant_id', '') <> '' then
      select * into v_variant
      from public.menu_item_variants
      where id = (v_item ->> 'variant_id')::uuid
        and menu_item_id = v_menu_item.id
      limit 1;
      if not found then
        raise exception 'Invalid option selection for %.', v_menu_item.name;
      end if;
      v_unit := v_unit + v_variant.price_delta;
    end if;

    for v_group in
      select g.id, g.name, g.min_select, g.max_select
      from public.menu_item_modifier_groups link
      join public.modifier_groups g on g.id = link.group_id
      where link.menu_item_id = v_menu_item.id
    loop
      select count(*) into v_group_count
      from jsonb_array_elements(
        case when jsonb_typeof(v_item -> 'option_ids') = 'array'
             then v_item -> 'option_ids' else '[]'::jsonb end
      ) elem
      where exists (
        select 1 from public.modifier_options o
        where o.id = (elem #>> '{}')::uuid and o.group_id = v_group.id
      );

      if v_group_count < coalesce(v_group.min_select, 0) then
        raise exception 'Choose at least % option(s) for %.',
          v_group.min_select, v_group.name;
      end if;
      if v_group.max_select is not null
         and v_group_count > v_group.max_select then
        raise exception 'Choose at most % option(s) for %.',
          v_group.max_select, v_group.name;
      end if;
    end loop;

    v_selected := '[]'::jsonb;
    if jsonb_typeof(v_item -> 'option_ids') = 'array' then
      for v_option_id in
        select (value #>> '{}')::uuid
        from jsonb_array_elements(v_item -> 'option_ids')
      loop
        select o.id, o.name as option_name, o.price_delta,
               g.name as group_name
        into v_option
        from public.modifier_options o
        join public.modifier_groups g on g.id = o.group_id
        where o.id = v_option_id
          and o.is_available
          and exists (
            select 1 from public.menu_item_modifier_groups m
            where m.menu_item_id = v_menu_item.id and m.group_id = g.id
          )
        limit 1;
        if not found then
          raise exception 'Invalid option selection for %.', v_menu_item.name;
        end if;
        v_unit := v_unit + v_option.price_delta;
        v_selected := v_selected || jsonb_build_object(
          'option_id', v_option.id,
          'group_name', v_option.group_name,
          'option_name', v_option.option_name,
          'price_delta', v_option.price_delta
        );
      end loop;
    end if;

    v_line := round(v_unit * v_qty, 2);

    insert into public.order_items (
      order_id, menu_item_id, name_snapshot, variant_name,
      unit_price, quantity, line_total, notes
    ) values (
      v_order_id, v_menu_item.id, v_menu_item.name, v_variant.name,
      v_unit, v_qty, v_line,
      nullif(trim(coalesce(v_item ->> 'notes', '')), '')
    )
    returning id into v_order_item_id;

    insert into public.order_item_modifiers (
      order_item_id, option_id, group_name, option_name, price_delta
    )
    select v_order_item_id,
           (value ->> 'option_id')::uuid,
           value ->> 'group_name',
           value ->> 'option_name',
           (value ->> 'price_delta')::numeric
    from jsonb_array_elements(v_selected);

    v_subtotal := v_subtotal + v_line;
  end loop;

  if v_settings.tax_enabled then
    v_tax := round(v_subtotal * coalesce(v_settings.tax_rate, 0) / 100, 2);
  end if;
  v_total := round(v_subtotal + v_tax, 2);

  update public.orders
  set subtotal = v_subtotal, tax_total = v_tax, total = v_total
  where id = v_order_id;

  insert into public.order_status_events (order_id, status, note)
  values (v_order_id, 'pending', 'Order placed');

  insert into public.payments (order_id, method, status, amount, reference)
  values (
    v_order_id, v_method,
    case when v_method = 'upi' then 'pending'::public.payment_status
         else 'unpaid'::public.payment_status end,
    v_total, v_reference
  );

  return jsonb_build_object(
    'id', v_order_id,
    'reference', v_reference,
    'tracking_token', v_token,
    'total', v_total
  );
end;
$$;

-- Customer-facing: fetch a single order by its unguessable tracking token.
create or replace function public.get_order_by_token(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_token is null or length(trim(p_token)) < 12 then
    return null;
  end if;
  select id into v_id
  from public.orders
  where tracking_token = trim(p_token)
  limit 1;
  if not found then
    return null;
  end if;
  return public.order_to_json(v_id);
end;
$$;

-- Staff-only: fetch one order with full detail.
create or replace function public.get_order_detail(p_order_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_any_role('owner', 'manager', 'cashier', 'kitchen') then
    raise exception 'Not authorised.';
  end if;
  return public.order_to_json(p_order_id);
end;
$$;

-- Staff-only: list orders (most recent first).
create or replace function public.list_orders()
returns setof jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_any_role('owner', 'manager', 'cashier', 'kitchen') then
    raise exception 'Not authorised.';
  end if;
  return query
    select public.order_to_json(o.id)
    from public.orders o
    order by o.placed_at desc;
end;
$$;

-- Staff-only: advance an order through the validated status flow.
create or replace function public.update_order_status(
  p_order_id uuid,
  p_status public.order_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.order_status;
begin
  if not public.has_any_role('owner', 'manager', 'cashier', 'kitchen') then
    raise exception 'Not authorised.';
  end if;

  select status into v_current
  from public.orders
  where id = p_order_id
  for update;
  if not found then
    raise exception 'Order not found.';
  end if;

  if not public.is_valid_transition(v_current, p_status) then
    raise exception 'Cannot move an order from % to %.', v_current, p_status;
  end if;

  update public.orders set status = p_status where id = p_order_id;

  insert into public.order_status_events (order_id, status, created_by)
  values (p_order_id, p_status, auth.uid());

  perform public.log_audit(
    'order_status_changed', 'order', p_order_id::text,
    jsonb_build_object('from', v_current, 'to', p_status)
  );
end;
$$;

-- Staff-only: mark an order paid at the counter.
create or replace function public.confirm_payment(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_any_role('owner', 'manager', 'cashier') then
    raise exception 'Not authorised.';
  end if;

  if not exists (select 1 from public.orders where id = p_order_id) then
    raise exception 'Order not found.';
  end if;

  update public.payments
  set status = 'paid', confirmed_by = auth.uid(), confirmed_at = now()
  where order_id = p_order_id and status <> 'paid';

  update public.orders
  set payment_status = 'paid'
  where id = p_order_id;

  perform public.log_audit('payment_confirmed', 'order', p_order_id::text, null);
end;
$$;

-- Staff-only: issue a fresh QR token for a table.
create or replace function public.regenerate_table_token(p_table_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table public.cafe_tables;
begin
  if not public.has_any_role('owner', 'manager') then
    raise exception 'Not authorised.';
  end if;

  update public.cafe_tables
  set token = upper(encode(gen_random_bytes(20), 'hex'))
  where id = p_table_id
  returning * into v_table;

  if not found then
    raise exception 'Table not found.';
  end if;

  perform public.log_audit('table_token_regenerated', 'cafe_table',
    p_table_id::text, null);

  return jsonb_build_object(
    'id', v_table.id,
    'label', v_table.label,
    'token', v_table.token,
    'seats', v_table.seats,
    'zone', v_table.zone,
    'is_active', v_table.is_active,
    'created_at', v_table.created_at
  );
end;
$$;
