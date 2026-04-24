create table if not exists public.web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean not null default true,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists web_push_subscriptions_is_active_idx
  on public.web_push_subscriptions (is_active);

create index if not exists web_push_subscriptions_device_id_idx
  on public.web_push_subscriptions (device_id);

create trigger set_web_push_subscriptions_updated_at
before update on public.web_push_subscriptions
for each row
execute function public.set_updated_at();

alter table public.web_push_subscriptions enable row level security;

create policy "public_insert_web_push_subscriptions"
on public.web_push_subscriptions
for insert
to anon, authenticated
with check (true);

create policy "public_update_web_push_subscriptions"
on public.web_push_subscriptions
for update
to anon, authenticated
using (true)
with check (true);
