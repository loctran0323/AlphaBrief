"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserTier, getMapLookupsToday, recordMapLookup, FREE_MAP_LOOKUPS_PER_DAY } from "@/lib/subscription";

export async function checkAndRecordLookup(ticker: string): Promise<
  { allowed: true } | { allowed: false; reason: "limit" | "auth" }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false, reason: "auth" };

  const [tier, usedToday] = await Promise.all([
    getUserTier(supabase, user.id, user.email),
    getMapLookupsToday(supabase, user.id),
  ]);

  if (tier === "pro") {
    await recordMapLookup(supabase, user.id, ticker);
    return { allowed: true };
  }

  if (usedToday >= FREE_MAP_LOOKUPS_PER_DAY) {
    return { allowed: false, reason: "limit" };
  }

  await recordMapLookup(supabase, user.id, ticker);
  return { allowed: true };
}
