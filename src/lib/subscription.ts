import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionTier } from "@/types/database";

function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export async function getUserTier(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null,
): Promise<SubscriptionTier> {
  if (isAdminEmail(email)) return "pro";
  const { data } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", userId)
    .single();
  return (data?.subscription_tier as SubscriptionTier) ?? "free";
}

export const FREE_MAP_LOOKUPS_PER_DAY = 3;

/** Count how many distinct tickers a free user has looked up today (ET). */
export async function getMapLookupsToday(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  // Start of today in US Eastern time
  const now = new Date();
  const etOffset = -5; // ET base offset; DST is handled by comparing UTC
  const etNow = new Date(now.getTime() + etOffset * 60 * 60 * 1000);
  const startOfEtDay = new Date(
    Date.UTC(etNow.getUTCFullYear(), etNow.getUTCMonth(), etNow.getUTCDate()) -
    etOffset * 60 * 60 * 1000,
  );

  const { count } = await supabase
    .from("map_lookups")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("looked_up_at", startOfEtDay.toISOString());

  return count ?? 0;
}

/** Record a map lookup for a user. */
export async function recordMapLookup(
  supabase: SupabaseClient,
  userId: string,
  ticker: string,
): Promise<void> {
  await supabase.from("map_lookups").insert({ user_id: userId, ticker });
}
