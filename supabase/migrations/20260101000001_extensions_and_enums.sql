-- 0001: Extensions and shared enum types
-- Safe to run once. Does not touch existing data.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'staff_role') then
    create type public.staff_role as enum ('owner', 'manager', 'cashier', 'kitchen');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum
      ('pending', 'accepted', 'preparing', 'ready', 'served', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum
      ('unpaid', 'pending', 'paid', 'refunded', 'failed');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('upi', 'counter');
  end if;

  if not exists (select 1 from pg_type where typname = 'selection_type') then
    create type public.selection_type as enum ('single', 'multiple');
  end if;
end
$$;
