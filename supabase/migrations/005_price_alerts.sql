create table if not exists public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  target_price numeric(12,4) not null,
  direction text not null check (direction in ('above', 'below')),
  active boolean not null default true,
  triggered_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.price_alerts enable row level security;

create policy "Users manage their own price alerts"
  on public.price_alerts for all using (auth.uid() = user_id);

create index price_alerts_user_id_idx on public.price_alerts(user_id);
create index price_alerts_active_idx on public.price_alerts(active) where active = true;
