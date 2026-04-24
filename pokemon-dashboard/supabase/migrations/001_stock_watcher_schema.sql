create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  retailer text not null default 'Smyths Toys',
  url text not null unique,
  price text,
  priority text not null default 'Medium',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint products_priority_check check (priority in ('High', 'Medium', 'Low'))
);

create table if not exists public.stock_checks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  status text not null,
  matched_signals jsonb not null default '[]'::jsonb,
  page_excerpt text,
  error text,
  checked_at timestamptz not null default now(),
  constraint stock_checks_status_check check (status in ('available', 'unavailable', 'unknown', 'error'))
);

create table if not exists public.product_status (
  product_id uuid primary key references public.products(id) on delete cascade,
  status text not null,
  previous_status text,
  matched_signals jsonb not null default '[]'::jsonb,
  last_checked_at timestamptz not null default now(),
  last_available_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now(),
  constraint product_status_status_check check (status in ('available', 'unavailable', 'unknown', 'error')),
  constraint product_status_previous_status_check check (
    previous_status is null or previous_status in ('available', 'unavailable', 'unknown', 'error')
  )
);

create table if not exists public.alert_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  alert_type text not null default 'stock_available',
  message text not null,
  sent boolean not null default false,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists products_is_active_idx
  on public.products (is_active);

create index if not exists stock_checks_product_id_checked_at_idx
  on public.stock_checks (product_id, checked_at desc);

create index if not exists product_status_status_idx
  on public.product_status (status);

create index if not exists alert_events_sent_created_at_idx
  on public.alert_events (sent, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_product_status_updated_at
before update on public.product_status
for each row
execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.stock_checks enable row level security;
alter table public.product_status enable row level security;
alter table public.alert_events enable row level security;

create policy "public_read_products"
on public.products
for select
to anon, authenticated
using (true);

create policy "public_read_product_status"
on public.product_status
for select
to anon, authenticated
using (true);
