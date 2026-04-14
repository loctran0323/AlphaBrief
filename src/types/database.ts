export type DigestFrequency = "none" | "daily" | "weekly";

export type SubscriptionTier = "free" | "pro";

export type EventType = "earnings" | "macro" | "catalyst";

export type Profile = {
  id: string;
  digest_frequency: DigestFrequency;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_period_end: string | null;
  created_at: string;
};

export type Watchlist = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type WatchlistItem = {
  id: string;
  watchlist_id: string;
  ticker: string;
  created_at: string;
};

export type MarketEvent = {
  id: string;
  ticker: string | null;
  title: string;
  event_type: EventType;
  event_date: string;
  why_it_matters: string;
  watch_for: string;
  created_at: string;
};
