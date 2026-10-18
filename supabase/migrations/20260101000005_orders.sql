-- 0005: Orders, order items, modifiers, status history, payments

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  tracking_token text not null unique,
  table_id uuid references public.cafe_tables(id) on delete set null,
  table_label text,
  customer_name text,
  customer_phone text,
  notes text,
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  payment_method public.payment_method not null default 'counter',
  subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  tax_total numeric(10, 2) not null default 0 check (tax_total >= 0),
  discount_total numeric(10, 2) not null default 0 check (discount_total >= 0),
  total numeric(10, 2) not null default 0 check (total >= 0),
  currency text not null default 'INR',
  placed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_placed_idx on public.orders(placed_at desc);
create index if not exists orders_table_idx on public.orders(table_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name_snapshot text not null,
  variant_name text,
  unit_price numeric(10, 2) not null default 0 check (unit_price >= 0),
  quantity integer not null default 1 check (quantity > 0 and quantity <= 100),
  line_total numeric(10, 2) not null default 0 check (line_total >= 0),
  notes text
);
create index if not exists order_items_order_idx on public.order_items(order_id);

create table if not exists public.order_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  option_id uuid references public.modifier_options(id) on delete set null,
  group_name text not null default '',
  option_name text not null,
  price_delta numeric(10, 2) not null default 0
);
create index if not exists order_item_modifiers_item_idx
  on public.order_item_modifiers(order_item_id);

create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists order_status_events_order_idx
  on public.order_status_events(order_id, created_at);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method public.payment_method not null,
  status public.payment_status not null default 'unpaid',
  amount numeric(10, 2) not null default 0 check (amount >= 0),
  reference text,
  confirmed_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists payments_order_idx on public.payments(order_id);

drop trigger if exists trg_orders_touch on public.orders;
create trigger trg_orders_touch
  before update on public.orders
  for each row execute function public.touch_updated_at();
