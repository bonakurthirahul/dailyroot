-- 0004: Cafe tables and global settings

create table if not exists public.cafe_tables (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  token text not null unique,
  seats integer not null default 2 check (seats >= 0),
  zone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.cafe_tables.token is
  'Unguessable token embedded in the table QR code. Grants no privileged access; it only pre-fills the table for a public order.';

drop trigger if exists trg_cafe_tables_touch on public.cafe_tables;
create trigger trg_cafe_tables_touch
  before update on public.cafe_tables
  for each row execute function public.touch_updated_at();

-- Single-row settings table keyed by a fixed text id.
create table if not exists public.cafe_settings (
  id text primary key default 'default',
  cafe_name text not null default 'Brew & Bean',
  tagline text,
  address text,
  phone text,
  upi_id text,
  currency text not null default 'INR',
  tax_enabled boolean not null default false,
  tax_label text not null default 'GST',
  tax_rate numeric(5, 2) not null default 0
    check (tax_rate >= 0 and tax_rate <= 100),
  service_charge_enabled boolean not null default false,
  service_charge_rate numeric(5, 2) not null default 0
    check (service_charge_rate >= 0 and service_charge_rate <= 100),
  accepting_orders boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.cafe_settings (id)
values ('default')
on conflict (id) do nothing;

drop trigger if exists trg_cafe_settings_touch on public.cafe_settings;
create trigger trg_cafe_settings_touch
  before update on public.cafe_settings
  for each row execute function public.touch_updated_at();

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity text not null,
  entity_id text,
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx
  on public.audit_logs(created_at desc);
