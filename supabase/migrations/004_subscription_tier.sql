-- Add subscription tier to user profiles
-- Run in Supabase SQL Editor after 003_remove_demo_macro_duplicates.sql

alter table public.profiles
  add column if not exists subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'pro')),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_period_end timestamptz;

-- Track daily map lookups for free-tier rate limiting
create table if not exists public.map_lookups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  ticker text not null,
  looked_up_at timestamptz not null default now()
);

create index if not exists map_lookups_user_date_idx
  on public.map_lookups (user_id, looked_up_at);

alter table public.map_lookups enable row level security;

create policy "Users manage own map lookups"
  on public.map_lookups
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
