-- AI-generated market summary cache (one row per period, shared across all users)
create table if not exists market_summaries (
  id           uuid        primary key default gen_random_uuid(),
  period       text        not null default 'daily',   -- 'daily' | 'weekly'
  summary      text        not null,
  generated_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

-- One cached row per period (upsert on conflict)
create unique index if not exists market_summaries_period_idx
  on market_summaries (period);

-- Public market data — no per-user sensitivity, disable RLS
alter table market_summaries disable row level security;
