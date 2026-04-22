import { YAHOO_UA } from "./market-map-data";

export type StockQuote = {
  symbol: string;
  shortName: string;
  longName: string;
  price: number | null;
  change: number;
  changePct: number;
  open: number | null;
  previousClose: number | null;
  dayLow: number | null;
  dayHigh: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
  volume: number | null;
  avgVolume: number | null;
  marketCap: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  eps: number | null;
  beta: number | null;
  dividendYield: number | null;
  exchange: string;
  currency: string;
  targetMeanPrice: number | null;
  targetHighPrice: number | null;
  targetLowPrice: number | null;
  numberOfAnalysts: number | null;
  recommendationKey: string | null;
};

export type ChartPoint = {
  ts: number;
  close: number;
  volume?: number;
};

export type ChartRange = "1d" | "5d" | "1mo" | "3mo" | "1y";

export type ResearchNewsItem = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
};

const RANGE_PARAMS: Record<ChartRange, { range: string; interval: string }> = {
  "1d": { range: "1d", interval: "5m" },
  "5d": { range: "5d", interval: "15m" },
  "1mo": { range: "1mo", interval: "1d" },
  "3mo": { range: "3mo", interval: "1d" },
  "1y": { range: "1y", interval: "1wk" },
};

type YahooRaw = { raw?: number };
function raw(obj: Record<string, unknown>, key: string): number | null {
  const val = obj[key];
  if (val == null) return null;
  if (typeof val === "number") return val;
  if (typeof val === "object" && val !== null && "raw" in val) {
    const r = (val as YahooRaw).raw;
    return typeof r === "number" ? r : null;
  }
  return null;
}

type FinnhubQuote = { c: number; d: number; dp: number; h: number; l: number; o: number; pc: number };
type FinnhubMetric = { metric: Record<string, number | string | null> };

async function fetchFinnhubQuoteAndMetrics(symbol: string): Promise<{ quote: FinnhubQuote | null; metric: Record<string, number | string | null> }> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return { quote: null, metric: {} };
  const base = `https://finnhub.io/api/v1`;
  const [qRes, mRes] = await Promise.all([
    fetch(`${base}/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`, { next: { revalidate: 60 } }),
    fetch(`${base}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${key}`, { next: { revalidate: 3600 } }),
  ]);
  const quote = qRes.ok ? (await qRes.json() as FinnhubQuote) : null;
  const metricData = mRes.ok ? (await mRes.json() as FinnhubMetric) : null;
  return { quote: quote?.c ? quote : null, metric: metricData?.metric ?? {} };
}

async function fetchChartMeta(symbol: string): Promise<StockQuote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": YAHOO_UA, Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { chart?: { result?: Array<{ meta?: Record<string, unknown> }> } };
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = raw(meta, "regularMarketPrice");
    const prev = raw(meta, "chartPreviousClose") ?? raw(meta, "previousClose");
    const change = price != null && prev != null ? price - prev : 0;
    const changePct = prev != null && prev !== 0 ? (change / prev) * 100 : 0;
    return {
      symbol: symbol.toUpperCase(),
      shortName: (meta.shortName as string) || (meta.longName as string) || symbol.toUpperCase(),
      longName: (meta.longName as string) || (meta.shortName as string) || symbol.toUpperCase(),
      price,
      change,
      changePct,
      open: null,
      previousClose: prev,
      dayLow: raw(meta, "regularMarketDayLow"),
      dayHigh: raw(meta, "regularMarketDayHigh"),
      fiftyTwoWeekLow: raw(meta, "fiftyTwoWeekLow"),
      fiftyTwoWeekHigh: raw(meta, "fiftyTwoWeekHigh"),
      volume: raw(meta, "regularMarketVolume"),
      avgVolume: null,
      marketCap: null,
      trailingPE: null,
      forwardPE: null,
      eps: null,
      beta: null,
      dividendYield: null,
      exchange: (meta.exchangeName as string) || (meta.fullExchangeName as string) || "",
      currency: (meta.currency as string) || "USD",
      targetMeanPrice: null,
      targetHighPrice: null,
      targetLowPrice: null,
      numberOfAnalysts: null,
      recommendationKey: null,
    };
  } catch {
    return null;
  }
}

export async function fetchStockDetail(symbol: string): Promise<StockQuote | null> {
  const [{ quote, metric }, chartMeta] = await Promise.all([
    fetchFinnhubQuoteAndMetrics(symbol),
    fetchChartMeta(symbol),
  ]);

  if (!chartMeta) return null;

  // Finnhub metric values — marketCap is in thousands, avgVolume in millions
  const m = metric;
  const n = (k: string): number | null => {
    const v = m[k];
    return typeof v === "number" && isFinite(v) ? v : null;
  };

  const price = quote?.c ?? chartMeta.price;
  const prev = quote?.pc ?? chartMeta.previousClose;
  const change = quote != null ? quote.d : (price != null && prev != null ? price - prev : 0);
  const changePct = quote != null ? quote.dp : chartMeta.changePct;

  const mcRaw = n("marketCapitalization");

  return {
    symbol: symbol.toUpperCase(),
    shortName: chartMeta.shortName,
    longName: chartMeta.longName,
    price,
    change,
    changePct,
    open: quote?.o ?? null,
    previousClose: prev,
    dayLow: quote?.l ?? chartMeta.dayLow,
    dayHigh: quote?.h ?? chartMeta.dayHigh,
    fiftyTwoWeekLow: n("52WeekLow") ?? chartMeta.fiftyTwoWeekLow,
    fiftyTwoWeekHigh: n("52WeekHigh") ?? chartMeta.fiftyTwoWeekHigh,
    volume: chartMeta.volume,
    avgVolume: n("3MonthAverageTradingVolume") != null ? (n("3MonthAverageTradingVolume")! * 1e6) : null,
    marketCap: mcRaw != null ? mcRaw * 1e6 : null,
    trailingPE: n("peTTM") ?? n("peNormalizedAnnual"),
    forwardPE: null,
    eps: n("epsTTM") ?? n("epsNormalizedAnnual"),
    beta: n("beta"),
    dividendYield: n("currentDividendYieldTTM") != null ? n("currentDividendYieldTTM")! / 100 : null,
    exchange: chartMeta.exchange,
    currency: chartMeta.currency,
    targetMeanPrice: null,
    targetHighPrice: null,
    targetLowPrice: null,
    numberOfAnalysts: null,
    recommendationKey: null,
  };
}

export async function fetchStockChart(symbol: string, range: ChartRange = "3mo"): Promise<ChartPoint[]> {
  const { range: r, interval } = RANGE_PARAMS[range];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${r}&interval=${interval}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": YAHOO_UA, Accept: "application/json" },
      next: { revalidate: range === "1d" ? 60 : 300 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      chart?: { result?: Array<{ timestamp?: number[]; indicators?: { quote?: Array<{ close?: (number | null)[]; volume?: (number | null)[] }> } }> };
    };
    const result = json?.chart?.result?.[0];
    if (!result) return [];

    const timestamps = result.timestamp ?? [];
    const quote = result.indicators?.quote?.[0] ?? {};
    const closes = quote.close ?? [];
    const volumes = quote.volume ?? [];

    const points: ChartPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      if (close == null || !Number.isFinite(close)) continue;
      points.push({ ts: timestamps[i]! * 1000, close, volume: volumes[i] ?? undefined });
    }
    return points;
  } catch {
    return [];
  }
}

export async function fetchTickerNews(symbol: string): Promise<ResearchNewsItem[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return [];
  const to = new Date();
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().split("T")[0]!;
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${fmt(from)}&to=${fmt(to)}&token=${key}`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ headline: string; url: string; datetime: number; summary: string; source: string }>;
    if (!Array.isArray(data)) return [];
    return data.slice(0, 12).map((item) => ({
      title: item.headline,
      link: item.url,
      pubDate: new Date(item.datetime * 1000).toISOString(),
      description: item.summary ?? "",
      source: item.source ?? "Finnhub",
    }));
  } catch {
    return [];
  }
}

export function formatLargeNumber(n: number | null): string {
  if (n == null) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

export function formatVolume(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
}

export function formatNum(n: number | null, decimals = 2): string {
  if (n == null) return "—";
  return n.toFixed(decimals);
}

export function formatPct(n: number | null): string {
  if (n == null) return "—";
  return `${(n * 100).toFixed(2)}%`;
}
