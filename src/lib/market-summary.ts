/**
 * Gets the cached daily market summary from Supabase, or generates a new one
 * via Gemini if the cache is stale (> 6 hours old).
 *
 * Falls back to the stale cache if Gemini fails or the key isn't configured.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateMarketSummaryText } from "@/lib/gemini-summary";

const CACHE_HOURS = 6;

export interface MarketSummaryResult {
  summary: string;
  generatedAt: string;
}

export async function getMarketSummary(): Promise<MarketSummaryResult | null> {
  // Use read-only anon client to check the cache
  const supabase = await createClient();
  const { data: cached } = await supabase
    .from("market_summaries")
    .select("summary, generated_at")
    .eq("period", "daily")
    .maybeSingle();

  // Return cache if fresh
  if (cached) {
    const ageHours =
      (Date.now() - new Date(cached.generated_at).getTime()) / 3_600_000;
    if (ageHours < CACHE_HOURS) {
      return { summary: cached.summary, generatedAt: cached.generated_at };
    }
  }

  // No key → return stale cache or nothing
  if (!process.env.GROQ_API_KEY) {
    return cached
      ? { summary: cached.summary, generatedAt: cached.generated_at }
      : null;
  }

  // Generate fresh summary
  try {
    const summary = await generateMarketSummaryText();
    const generatedAt = new Date().toISOString();

    // Write via service-role client (bypasses RLS)
    const admin = createAdminClient();
    await admin
      .from("market_summaries")
      .upsert({ period: "daily", summary, generated_at: generatedAt }, { onConflict: "period" });

    return { summary, generatedAt };
  } catch (err) {
    console.error("[market-summary] generation failed:", err);
    // Fall back to stale cache rather than showing nothing
    return cached
      ? { summary: cached.summary, generatedAt: cached.generated_at }
      : null;
  }
}
