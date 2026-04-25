/**
 * Gets cached AI market summaries from Supabase, generating fresh ones via Groq when stale.
 * - Daily summary: 6-hour cache (period = 'daily')
 * - Weekly recap:  24-hour cache (period = 'weekly')
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateMarketSummaryText, generateWeeklySummaryText, generateTrendingQueriesText } from "@/lib/gemini-summary";

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
    if (ageHours < 3) return { summary: cached.summary, generatedAt: cached.generated_at };
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

// ── Trending queries ──────────────────────────────────────────────────────────

export type TrendingQuery = { q: string; d: string };

const FALLBACK_TRENDING: TrendingQuery[] = [
  { q: "S&P 500 outlook this week",  d: "+94%"  },
  { q: "Fed rate decision timeline",  d: "+71%"  },
  { q: "Nasdaq earnings season",      d: "+58%"  },
  { q: "Treasury yield impact stocks", d: "+43%" },
];

export async function getTrendingQueries(): Promise<TrendingQuery[]> {
  const cached = await fetchCached("trending_queries");

  if (cached) {
    const ageHours = (Date.now() - new Date(cached.generated_at).getTime()) / 3_600_000;
    if (ageHours < 1) {
      try { return JSON.parse(cached.summary) as TrendingQuery[]; } catch { /* fall through */ }
    }
  }

  if (!process.env.GROQ_API_KEY) {
    if (cached) {
      try { return JSON.parse(cached.summary) as TrendingQuery[]; } catch { /* fall through */ }
    }
    return FALLBACK_TRENDING;
  }

  try {
    const raw = await generateTrendingQueriesText();
    // Strip any markdown fences Groq might add
    const json = raw.replace(/^```[a-z]*\n?/i, "").replace(/```$/,"").trim();
    const parsed = JSON.parse(json) as TrendingQuery[];
    const generatedAt = new Date().toISOString();
    await writeSummary("trending_queries", JSON.stringify(parsed), generatedAt);
    return parsed;
  } catch (err) {
    console.error("[market-summary/trending] generation failed:", err);
    if (cached) {
      try { return JSON.parse(cached.summary) as TrendingQuery[]; } catch { /* fall through */ }
    }
    return FALLBACK_TRENDING;
  }
}
