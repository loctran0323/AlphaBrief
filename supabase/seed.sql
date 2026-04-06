-- Run once after migration. Macro calendar is app-generated (ET schedule); keep seed to tickers only.

insert into public.market_events (ticker, title, event_type, event_date, why_it_matters, watch_for)
values
  ('AAPL', 'Q2 earnings release', 'earnings', now() + interval '5 days',
   'Apple''s iPhone mix and services growth drive sentiment for mega-cap tech.',
   'Guidance, China revenue, and capital return updates.'),
  ('NVDA', 'GTC keynote / product updates', 'catalyst', now() + interval '7 days',
   'New chip and software announcements can reset AI demand narratives.',
   'Data center revenue commentary and roadmap hints for Blackwell rollout.');
