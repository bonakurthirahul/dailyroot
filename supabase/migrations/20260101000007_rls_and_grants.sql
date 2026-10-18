-- 0007: Row Level Security, grants, and realtime
-- Principle: catalog + settings + table tokens are publicly readable (they are
-- not secrets). Orders and payments are staff-only. All writes happen through
-- SECURITY DEFINER functions that run as the table owner (bypassing RLS) and
-- re-validate every input and price server-side.

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_item_variants enable row level security;
alter table public.modifier_groups enable row level security;
alter table public.modifier_options enable row level security;
alter table public.menu_item_modifier_groups enable row level security;
alter table public.cafe_tables enable row level security;
alter table public.cafe_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_modifiers enable row level security;
alter table public.order_status_events enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid() or public.has_any_role('owner', 'manager')
  );

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (public.has_any_role('owner'))
  with check (public.has_any_role('owner'));

-- catalog (public read, manager/owner write) ---------------------------------
do $$
declare
  t text;
  catalog_tables text[] := array[
    'categories', 'menu_items', 'menu_item_variants',
    'modifier_groups', 'modifier_options', 'menu_item_modifier_groups'
  ];
begin
  foreach t in array catalog_tables loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format(
      'create policy %I_select on public.%I for select using (true)', t, t);

    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format(
      'create policy %I_write on public.%I for all
         using (public.has_any_role(''owner'', ''manager''))
         with check (public.has_any_role(''owner'', ''manager''))', t, t);
  end loop;
end
$$;

-- cafe_tables ---------------------------------------------------------------
drop policy if exists cafe_tables_select on public.cafe_tables;
create policy cafe_tables_select on public.cafe_tables
  for select using (
    public.has_any_role('owner', 'manager', 'cashier', 'kitchen')
  );
-- cafe_settings -------------------------------------------------------------
drop policy if exists cafe_settings_select on public.cafe_settings;
create policy cafe_settings_select on public.cafe_settings
  for select using (true);

drop policy if exists cafe_settings_update on public.cafe_settings;
create policy cafe_settings_update on public.cafe_settings
  for update using (public.has_any_role('owner', 'manager'))
  with check (public.has_any_role('owner', 'manager'));

-- orders and related (staff read only; writes via functions) ----------------
do $$
declare
  t text;
  staff_tables text[] := array[
    'orders', 'order_items', 'order_item_modifiers',
    'order_status_events', 'payments'
  ];
begin
  foreach t in array staff_tables loop
    execute format('drop policy if exists %I_staff_select on public.%I', t, t);
    execute format(
      'create policy %I_staff_select on public.%I for select
         using (public.has_any_role(''owner'', ''manager'', ''cashier'', ''kitchen''))',
      t, t);
  end loop;
end
$$;

-- audit_logs ----------------------------------------------------------------
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select using (public.has_any_role('owner', 'manager'));

-- grants --------------------------------------------------------------------

grant select on
  public.categories,
  public.menu_items,
  public.menu_item_variants,
  public.modifier_groups,
  public.modifier_options,
  public.menu_item_modifier_groups,
  public.cafe_tables,
  public.cafe_settings
to anon, authenticated;

revoke select on public.cafe_tables from anon;
grant select on public.cafe_tables to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on
  public.categories,
  public.menu_items,
  public.menu_item_variants,
  public.modifier_groups,
  public.modifier_options,
  public.menu_item_modifier_groups,
  public.cafe_tables
to authenticated;
grant select, update on public.cafe_settings to authenticated;
grant select on
  public.orders,
  public.order_items,
  public.order_item_modifiers,
  public.order_status_events,
  public.payments,
  public.audit_logs
to authenticated;

-- function grants -----------------------------------------------------------
revoke execute on function public.log_audit(text, text, text, jsonb) from public;
revoke execute on function public.order_to_json(uuid) from public;
revoke execute on function public.is_valid_transition(public.order_status, public.order_status) from public;

revoke execute on function public.resolve_table_by_token(text) from public;
revoke execute on function public.create_order(jsonb) from public;
revoke execute on function public.get_order_by_token(text) from public;
revoke execute on function public.get_order_detail(uuid) from public;
revoke execute on function public.list_orders() from public;
revoke execute on function public.update_order_status(uuid, public.order_status) from public;
revoke execute on function public.confirm_payment(uuid) from public;
revoke execute on function public.regenerate_table_token(uuid) from public;
revoke execute on function public.current_staff_role() from public;
revoke execute on function public.has_any_role(public.staff_role[]) from public;
revoke execute on function public.is_active_staff() from public;

grant execute on function public.resolve_table_by_token(text) to anon, authenticated;
grant execute on function public.create_order(jsonb) to anon, authenticated;
grant execute on function public.get_order_by_token(text) to anon, authenticated;
grant execute on function public.get_order_detail(uuid) to authenticated;
grant execute on function public.list_orders() to authenticated;
grant execute on function public.update_order_status(uuid, public.order_status) to authenticated;
grant execute on function public.confirm_payment(uuid) to authenticated;
grant execute on function public.regenerate_table_token(uuid) to authenticated;
grant execute on function public.current_staff_role() to authenticated;
grant execute on function public.has_any_role(public.staff_role[]) to authenticated;
grant execute on function public.is_active_staff() to authenticated;

-- realtime ------------------------------------------------------------------
alter table public.orders replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'order_status_events'
  ) then
    alter publication supabase_realtime add table public.order_status_events;
  end if;
end
$$;
