import crypto from "node:crypto";
import type { MarketEvent } from "@/types/database";

type FinnhubEarning = {
  date: string; // "2024-01-25"
  epsEstimate: number | null;
  revenueEstimate: number | null;
  hour: "bmo" | "amc" | "dmh" | string; // before market open, after market close, during market hours
  quarter: number;
  symbol: string;
  year: number;
};

function formatRevenue(n: number | null): string {
  if (n == null) return "N/A";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function earningToEvent(e: FinnhubEarning): MarketEvent {
  // BMO ≈ 9:00 ET = 13:00 UTC, AMC ≈ 16:30 ET = 20:30 UTC, DMH ≈ midday
  const timeByHour: Record<string, string> = {
    bmo: "13:00:00Z",
    amc: "20:30:00Z",
    dmh: "17:00:00Z",
  };
  const timeStr = timeByHour[e.hour] ?? "13:00:00Z";
  const eventDate = `${e.date}T${timeStr}`;

  const epsStr = e.epsEstimate != null ? `EPS est. $${e.epsEstimate.toFixed(2)}` : null;
  const revStr = e.revenueEstimate != null ? `Revenue est. ${formatRevenue(e.revenueEstimate)}` : null;
  const estimates = [epsStr, revStr].filter(Boolean).join(" · ");

  const whenLabel = e.hour === "bmo" ? "before market open" : e.hour === "amc" ? "after market close" : "during market hours";

  return {
    id: `earnings-${crypto.createHash("sha1").update(`${e.symbol}-${e.date}-${e.quarter}`).digest("hex").slice(0, 20)}`,
    ticker: e.symbol,
    title: `${e.symbol} Q${e.quarter} ${e.year} Earnings`,
    event_type: "earnings",
    event_date: eventDate,
    why_it_matters: `Quarterly earnings release for ${e.symbol} — one of the key data points for assessing company health and forward guidance.`,
    watch_for: estimates
      ? `Reporting ${whenLabel}. Analyst estimates: ${estimates}. Watch for EPS beat/miss and any revision to forward guidance.`
      : `Reporting ${whenLabel}. Watch for EPS beat/miss and any revision to forward guidance.`,
    created_at: new Date().toISOString(),
  };
}

/** Fetch upcoming earnings for watched tickers from Finnhub (next 45 days). */
export async function fetchEarningsForTickers(tickers: string[]): Promise<MarketEvent[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key || tickers.length === 0) return [];

  const upper = [...new Set(tickers.map((t) => t.trim().toUpperCase()).filter(Boolean))];
  const from = new Date();
  const to = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().split("T")[0]!;

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/calendar/earnings?from=${fmt(from)}&to=${fmt(to)}&token=${key}`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { earningsCalendar?: FinnhubEarning[] };
    if (!Array.isArray(data.earningsCalendar)) return [];

    return data.earningsCalendar
      .filter((e) => upper.includes(e.symbol?.toUpperCase()))
      .map(earningToEvent);
  } catch {
    return [];
  }
}
