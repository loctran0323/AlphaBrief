/**
 * Gets cached AI market summaries from Supabase, generating fresh ones via Groq when stale.
 * - Daily summary: 6-hour cache (period = 'daily')
 * - Weekly recap:  24-hour cache (period = 'weekly')
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateMarketSummaryText, generateWeeklySummaryText } from "@/lib/gemini-summary";

export interface MarketSummaryResult {
  summary: string;
  generatedAt: string;
}

async function fetchCached(period: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("market_summaries")
    .select("summary, generated_at")
    .eq("period", period)
    .maybeSingle();
  return data;
}

async function writeSummary(period: string, summary: string, generatedAt: string) {
  const admin = createAdminClient();
  await admin
    .from("market_summaries")
    .upsert({ period, summary, generated_at: generatedAt }, { onConflict: "period" });
}

// ── Daily ────────────────────────────────────────────────────────────────────

export async function getMarketSummary(): Promise<MarketSummaryResult | null> {
  const cached = await fetchCached("daily");

  if (cached) {
    const ageHours = (Date.now() - new Date(cached.generated_at).getTime()) / 3_600_000;
    if (ageHours < 6) return { summary: cached.summary, generatedAt: cached.generated_at };
  }

  if (!process.env.GROQ_API_KEY) {
    return cached ? { summary: cached.summary, generatedAt: cached.generated_at } : null;
  }

  try {
    const summary = await generateMarketSummaryText();
    const generatedAt = new Date().toISOString();
    await writeSummary("daily", summary, generatedAt);
    return { summary, generatedAt };
  } catch (err) {
    console.error("[market-summary/daily] generation failed:", err);
    return cached ? { summary: cached.summary, generatedAt: cached.generated_at } : null;
  }
}

// ── Weekly ───────────────────────────────────────────────────────────────────

export async function getWeeklyMarketSummary(): Promise<MarketSummaryResult | null> {
  const cached = await fetchCached("weekly");

  if (cached) {
    const ageHours = (Date.now() - new Date(cached.generated_at).getTime()) / 3_600_000;
    if (ageHours < 24) return { summary: cached.summary, generatedAt: cached.generated_at };
  }

  if (!process.env.GROQ_API_KEY) {
    return cached ? { summary: cached.summary, generatedAt: cached.generated_at } : null;
  }

  try {
    const summary = await generateWeeklySummaryText();
    const generatedAt = new Date().toISOString();
    await writeSummary("weekly", summary, generatedAt);
    return { summary, generatedAt };
  } catch (err) {
    console.error("[market-summary/weekly] generation failed:", err);
    return cached ? { summary: cached.summary, generatedAt: cached.generated_at } : null;
  }
}
