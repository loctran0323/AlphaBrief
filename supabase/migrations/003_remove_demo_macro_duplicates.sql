-- Removes legacy seed macro rows that duplicate the in-app ET calendar (CPI / FOMC).
-- Safe only if you still have the original demo text; skip if you rely on these DB rows.

delete from public.market_events
where ticker is null
  and (
    (title = 'CPI (headline)' and why_it_matters like '%Inflation prints move rate-cut%')
    or (title = 'FOMC rate decision' and why_it_matters like '%Fed guidance sets expectations%')
  );
