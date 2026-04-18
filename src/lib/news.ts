import crypto from "node:crypto";
import type { NewsArticle } from "@/types/news";
import { rssGetTag } from "@/lib/rss-parse";

/** Common ticker → name aliases so "Amazon" matches AMZN, "Apple" matches AAPL, etc. */
const TICKER_ALIASES: Record<string, string[]> = {
  AMZN: ["amazon"],
  AAPL: ["apple"],
  MSFT: ["microsoft"],
  GOOGL: ["google", "alphabet"],
  GOOG: ["google", "alphabet"],
  META: ["meta", "facebook"],
  TSLA: ["tesla"],
  NVDA: ["nvidia"],
  NFLX: ["netflix"],
  AMD: ["amd", "advanced micro"],
  INTC: ["intel"],
  ORCL: ["oracle"],
  CRM: ["salesforce"],
  ADBE: ["adobe"],
  PYPL: ["paypal"],
  UBER: ["uber"],
  LYFT: ["lyft"],
  SHOP: ["shopify"],
  COIN: ["coinbase"],
  PLTR: ["palantir"],
  SNAP: ["snap", "snapchat"],
  TWTR: ["twitter", "x corp"],
  SPOT: ["spotify"],
  ABNB: ["airbnb"],
  DASH: ["doordash"],
  RBLX: ["roblox"],
  BA: ["boeing"],
  JPM: ["jpmorgan", "j.p. morgan"],
  GS: ["goldman sachs", "goldman"],
  MS: ["morgan stanley"],
  BAC: ["bank of america"],
  WFC: ["wells fargo"],
  C: ["citigroup", "citi"],
  V: ["visa"],
  MA: ["mastercard"],
  BRK: ["berkshire"],
  JNJ: ["johnson & johnson", "johnson and johnson"],
  PFE: ["pfizer"],
  MRNA: ["moderna"],
  UNH: ["unitedhealth"],
  CVX: ["chevron"],
  XOM: ["exxon"],
  WMT: ["walmart"],
  TGT: ["target"],
  HD: ["home depot"],
  DIS: ["disney"],
  CMCSA: ["comcast"],
  T: ["at&t"],
  VZ: ["verizon"],
};

type SourceFeed = {
  source: string;
  url: string;
};

type RssItem = {
  title: string;
  link: string;
  pubDate: string | null;
  description: string;
  source: string;
};

type NormalizedItem = RssItem & {
  nativeSentiment?: "bullish" | "bearish" | "neutral";
  nativeSummary?: string;
  nativeRationale?: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Main briefing: keep RSS items published within the last N days (older items move to archive view). */
export const NEWS_VISIBLE_MAX_AGE_MS = 3 * MS_PER_DAY;

/** Archive lists exclude items newer than this (no overlap with main briefing). */
export function isPublishedBeforeArchiveCutoff(
  pubDate: string | null,
  nowMs = Date.now(),
): boolean {
  if (!pubDate) return false;
  const t = Date.parse(pubDate);
  if (Number.isNaN(t)) return false;
  return nowMs - t > NEWS_VISIBLE_MAX_AGE_MS;
}

/** How far back to pull from feeds when building ranked lists (archive band uses overlap with visible). */
const NEWS_RSS_FETCH_MAX_AGE_MS = 30 * MS_PER_DAY;

function publishedWithinWindow(pubDate: string | null, maxAgeMs: number, now = Date.now()): boolean {
  if (!pubDate) return true;
  const t = Date.parse(pubDate);
  if (Number.isNaN(t)) return true;
  return now - t <= maxAgeMs;
}

type NewsBrief = {
  summary: string;
  marketImpact: "bullish" | "bearish" | "neutral";
  rationale: string;
  keyPoints: string[];
};

const FEEDS: SourceFeed[] = [
  { source: "NYT", url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml" },
  { source: "Reuters", url: "https://feeds.reuters.com/reuters/businessNews" },
  { source: "Bloomberg", url: "https://feeds.bloomberg.com/markets/news.rss" },
  { source: "CNBC", url: "https://www.cnbc.com/id/10001147/device/rss/rss.html" },
  { source: "MarketWatch", url: "https://feeds.marketwatch.com/marketwatch/topstories/" },
  { source: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
  { source: "CNN Business", url: "http://rss.cnn.com/rss/money_latest.rss" },
  { source: "Nasdaq", url: "https://www.nasdaq.com/feed/rssoutbound?category=Stocks" },
];

/** Newest N rows from the merged feed always qualify (general market discovery, not just watchlist/macro). */
const TOP_MERGED_FEED_SLOTS = 50;

/**
 * Popular tickers surfaced in the "All" tab even when not in the user's watchlist.
 * Articles mentioning these get tagged so users discover market movers beyond their list.
 */
const DISCOVERY_TICKERS = [
  "NVDA", "AAPL", "MSFT", "TSLA", "META", "GOOGL", "GOOG", "AMD",
  "NFLX", "UBER", "COIN", "PLTR", "SPY", "QQQ", "JPM", "BAC",
  "AMZN", "GS", "V", "MA", "DIS", "XOM", "CVX", "WMT",
];

const MACRO_KEYWORDS = [
  "inflation",
  "cpi",
  "fed",
  "federal reserve",
  "rates",
  "treasury",
  "jobs report",
  "gdp",
  "housing",
  "home sales",
  "mortgage",
  "case-shiller",
  "nahb",
  "permits",
  "housing starts",
  "pmi",
  "jobless",
  "oil",
  "crude",
  "ecb",
  "euro zone",
  "durable goods",
];

// ─── Alpha Vantage ────────────────────────────────────────────────────────────

type AvFeedItem = {
  title: string;
  url: string;
  time_published: string; // "20240115T143000"
  summary: string;
  source: string;
  overall_sentiment_score: number;
  overall_sentiment_label: string;
  ticker_sentiment?: Array<{
    ticker: string;
    relevance_score: string;
    ticker_sentiment_score: string;
    ticker_sentiment_label: string;
  }>;
};

function avSentimentLabel(label: string): "bullish" | "bearish" | "neutral" {
  const l = label.toLowerCase();
  if (l.includes("bullish")) return "bullish";
  if (l.includes("bearish")) return "bearish";
  return "neutral";
}

function avTimeToIso(t: string): string {
  // "20240115T143000" → "2024-01-15T14:30:00Z"
  try {
    const y = t.slice(0, 4);
    const mo = t.slice(4, 6);
    const d = t.slice(6, 8);
    const h = t.slice(9, 11);
    const mi = t.slice(11, 13);
    const s = t.slice(13, 15) || "00";
    return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
  } catch {
    return new Date().toISOString();
  }
}

/** AV time format: YYYYMMDDTHHMM */
function toAvTime(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
}

async function fetchAlphaVantageNews(
  tickers: string[],
  opts?: { fromMs?: number; toMs?: number },
): Promise<NormalizedItem[]> {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return [];

  const tickerParam = tickers.slice(0, 5).join(",");
  const params = new URLSearchParams({ function: "NEWS_SENTIMENT", sort: "LATEST", limit: "50", apikey: key });
  if (tickerParam) params.set("tickers", tickerParam);
  if (opts?.fromMs) params.set("time_from", toAvTime(opts.fromMs));
  if (opts?.toMs) params.set("time_to", toAvTime(opts.toMs));
  const base = `https://www.alphavantage.co/query?${params.toString()}`;

  try {
    const res = await fetch(base, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { feed?: AvFeedItem[] };
    if (!Array.isArray(data.feed)) return [];

    return data.feed.map((item) => {
      const pubDate = avTimeToIso(item.time_published);
      const sentiment = avSentimentLabel(item.overall_sentiment_label);
      const rationale =
        sentiment === "bullish"
          ? "Alpha Vantage rates this headline as positive for equities."
          : sentiment === "bearish"
            ? "Alpha Vantage rates this headline as negative for risk assets."
            : "Alpha Vantage rates this headline as neutral.";

      // Only tag a ticker if relevance score is meaningful (>=0.35), not just a passing mention
      const topTicker = item.ticker_sentiment
        ?.sort((a, b) => parseFloat(b.relevance_score) - parseFloat(a.relevance_score))
        .find((ts) => tickers.includes(ts.ticker.toUpperCase()) && parseFloat(ts.relevance_score) >= 0.35);

      return {
        title: sanitizePlainText(item.title, 220),
        link: item.url,
        pubDate,
        description: sanitizePlainText(item.summary, 280),
        source: item.source ?? "Alpha Vantage",
        nativeSentiment: sentiment,
        nativeSummary: sanitizePlainText(item.summary, 220),
        nativeRationale: rationale,
        // attach matched ticker from AV data
        _avMatchedTicker: topTicker?.ticker ?? null,
      } as NormalizedItem & { _avMatchedTicker: string | null };
    });
  } catch {
    return [];
  }
}

// ─── Finnhub ──────────────────────────────────────────────────────────────────

type FinnhubNewsItem = {
  category: string;
  datetime: number; // unix timestamp
  headline: string;
  id: number;
  related: string;
  source: string;
  summary: string;
  url: string;
};

async function fetchFinnhubNews(): Promise<NormalizedItem[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${key}`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as FinnhubNewsItem[];
    if (!Array.isArray(data)) return [];

    return data.slice(0, 40).map((item) => ({
      title: sanitizePlainText(item.headline, 220),
      link: item.url,
      pubDate: new Date(item.datetime * 1000).toISOString(),
      description: sanitizePlainText(item.summary, 280),
      source: item.source ?? "Finnhub",
    }));
  } catch {
    return [];
  }
}

async function fetchFinnhubTickerNews(
  ticker: string,
  opts?: { fromMs?: number; toMs?: number },
): Promise<NormalizedItem[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return [];

  const to = opts?.toMs ? new Date(opts.toMs) : new Date();
  const from = opts?.fromMs ? new Date(opts.fromMs) : new Date(Date.now() - 7 * MS_PER_DAY);
  const fmt = (d: Date) => d.toISOString().split("T")[0]!;

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(ticker)}&from=${fmt(from)}&to=${fmt(to)}&token=${key}`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as FinnhubNewsItem[];
    if (!Array.isArray(data)) return [];

    return data.slice(0, 20).map((item) => ({
      title: sanitizePlainText(item.headline, 220),
      link: item.url,
      pubDate: new Date(item.datetime * 1000).toISOString(),
      description: sanitizePlainText(item.summary, 280),
      source: item.source ?? "Finnhub",
    }));
  } catch {
    return [];
  }
}

// ─── Build article list ───────────────────────────────────────────────────────

async function buildNewsArticleList(
  tickers: string[],
  candidateCap: number,
): Promise<NewsArticle[]> {
  // Fetch per-ticker Finnhub company news — cap at 3 per ticker so general news still fills "All"
  const MAX_PER_TICKER = 3;
  const perTickerFinnhub = tickers.length > 0
    ? await Promise.all(tickers.map(async (t) => {
        const items = await fetchFinnhubTickerNews(t);
        return items.slice(0, MAX_PER_TICKER).map((item) => ({ ...item, _forcedTicker: t }));
      }))
    : [];
  const tickerFinnhubFlat = perTickerFinnhub.flat();

  const [feedItems, avItems, finnhubItems] = await Promise.all([
    loadFeedItems(NEWS_RSS_FETCH_MAX_AGE_MS),
    fetchAlphaVantageNews(tickers),
    fetchFinnhubNews(),
  ]);

  // Merge: per-ticker Finnhub first (guaranteed coverage), then AV, general Finnhub, RSS
  const allItems = dedupeByLink([...tickerFinnhubFlat, ...avItems, ...finnhubItems, ...feedItems]);

  const candidates = allItems
    .map((item, rank) => toCandidate(item as NormalizedItem, tickers, rank))
    .filter((item): item is NormalizedItem & { matchedTicker: string | null } => item !== null)
    .slice(0, candidateCap);

  // Items with native sentiment skip OpenAI
  const needsSummarization = candidates.filter((c) => !c.nativeSentiment);
  const summaries = await summarizeArticles(needsSummarization);

  let summIdx = 0;
  return candidates.map((item) => {
    if (item.nativeSentiment) {
      // If AV says neutral, let lexicon have a chance to override
      const impact = item.nativeSentiment === "neutral"
        ? reconcileLexicon({ summary: item.nativeSummary ?? "", marketImpact: "neutral", rationale: item.nativeRationale ?? "", keyPoints: [] }, item)
        : { marketImpact: item.nativeSentiment, rationale: item.nativeRationale ?? "" };
      return {
        id: crypto.createHash("sha1").update(`${item.link}-${item.pubDate ?? ""}`).digest("hex"),
        source: item.source,
        title: item.title,
        url: item.link,
        publishedAt: item.pubDate,
        summary: item.nativeSummary ?? fallbackSummary(item),
        keyPoints: [],
        matchedTicker: item.matchedTicker,
        category: classifyCategory(item),
        marketImpact: impact.marketImpact,
        marketImpactRationale: impact.rationale,
      };
    }

    const brief = summaries[summIdx++];
    return {
      id: crypto.createHash("sha1").update(`${item.link}-${item.pubDate ?? ""}`).digest("hex"),
      source: item.source,
      title: item.title,
      url: item.link,
      publishedAt: item.pubDate,
      summary: sanitizePlainText(brief?.summary ?? fallbackSummary(item), 220),
      keyPoints: brief?.keyPoints ?? [],
      matchedTicker: item.matchedTicker,
      category: classifyCategory(item),
      marketImpact: brief?.marketImpact ?? inferImpact(item).marketImpact,
      marketImpactRationale: brief?.rationale ?? inferImpact(item).rationale,
    };
  });
}

/** Ranked rows (RSS + AV + Finnhub) whose pubDate falls in [from, to]. */
async function buildNewsArticleListInPublishedRange(
  tickers: string[],
  publishedFromMs: number,
  publishedToMs: number,
  summarizeCap: number,
): Promise<NewsArticle[]> {
  const dateOpts = { fromMs: publishedFromMs, toMs: publishedToMs };

  // Per-ticker Finnhub historical news — higher cap for archive
  const perTickerFinnhubArchive = tickers.length > 0
    ? await Promise.all(tickers.map(async (t) => {
        const items = await fetchFinnhubTickerNews(t, dateOpts);
        return items.slice(0, 20).map((item) => ({ ...item, _forcedTicker: t }));
      }))
    : [];

  const [feedItems, avItems, finnhubItems] = await Promise.all([
    loadFeedItems(NEWS_RSS_FETCH_MAX_AGE_MS),
    fetchAlphaVantageNews(tickers, dateOpts),
    fetchFinnhubNews(),
  ]);

  const tickerFinnhubFlat = perTickerFinnhubArchive.flat();

  const allItems = dedupeByLink([...tickerFinnhubFlat, ...avItems, ...finnhubItems, ...feedItems]);

  const inRange = (item: RssItem) => {
    if (!item.pubDate) return false;
    const t = Date.parse(item.pubDate);
    if (Number.isNaN(t)) return false;
    return t >= publishedFromMs && t <= publishedToMs;
  };

  const candidates = allItems
    .filter(inRange)
    .map((item, rank) => toCandidate(item as NormalizedItem, tickers, rank, { archiveMode: true }))
    .filter((item): item is NormalizedItem & { matchedTicker: string | null } => item !== null)
    .slice(0, Math.max(0, summarizeCap));

  const needsSummarization = candidates.filter((c) => !(c as NormalizedItem).nativeSentiment);
  const summaries = await summarizeArticles(needsSummarization);

  let summIdx = 0;
  return candidates.map((item) => {
    if ((item as NormalizedItem).nativeSentiment) {
      const n = item as NormalizedItem;
      const impact = n.nativeSentiment === "neutral"
        ? reconcileLexicon({ summary: n.nativeSummary ?? "", marketImpact: "neutral", rationale: n.nativeRationale ?? "", keyPoints: [] }, item)
        : { marketImpact: n.nativeSentiment!, rationale: n.nativeRationale ?? "" };
      return {
        id: crypto.createHash("sha1").update(`${item.link}-${item.pubDate ?? ""}`).digest("hex"),
        source: item.source,
        title: item.title,
        url: item.link,
        publishedAt: item.pubDate,
        summary: n.nativeSummary ?? fallbackSummary(item),
        keyPoints: [],
        matchedTicker: item.matchedTicker,
        category: classifyCategory(item),
        marketImpact: impact.marketImpact,
        marketImpactRationale: impact.rationale,
      };
    }
    const brief = summaries[summIdx++];
    return {
      id: crypto.createHash("sha1").update(`${item.link}-${item.pubDate ?? ""}`).digest("hex"),
      source: item.source,
      title: item.title,
      url: item.link,
      publishedAt: item.pubDate,
      summary: sanitizePlainText(brief?.summary ?? fallbackSummary(item), 220),
      keyPoints: brief?.keyPoints ?? [],
      matchedTicker: item.matchedTicker,
      category: classifyCategory(item),
      marketImpact: brief?.marketImpact ?? inferImpact(item).marketImpact,
      marketImpactRationale: brief?.rationale ?? inferImpact(item).rationale,
    };
  });
}

export async function getNewsBriefing(params: {
  tickers: string[];
  limit?: number;
  /** Cap how many RSS rows are summarized (default scales with limit). Use a small value for email digests. */
  candidateCap?: number;
}): Promise<NewsArticle[]> {
  const tickers = [...new Set(params.tickers.map((t) => t.trim().toUpperCase()).filter(Boolean))];
  const limit = params.limit ?? 8;
  const candidateCap =
    params.candidateCap ?? Math.max(120, Math.min(200, limit * 3));

  const mapped = await buildNewsArticleList(
    tickers,
    Math.max(limit, Math.min(200, candidateCap)),
  );

  return mapped
    .filter((a) => publishedWithinWindow(a.publishedAt, NEWS_VISIBLE_MAX_AGE_MS))
    .slice(0, limit);
}

/**
 * Archive headlines in a chosen published-at window (RSS ~30d lookback). Summarization is capped
 * separately to keep OpenAI payloads bounded; raise cap when `OPENAI_API_KEY` is unset (fallback only).
 */
export async function getArchivedNewsBriefing(params: {
  tickers: string[];
  limit?: number;
  publishedFromMs: number;
  publishedToMs: number;
}): Promise<NewsArticle[]> {
  const tickers = [...new Set(params.tickers.map((t) => t.trim().toUpperCase()).filter(Boolean))];
  const limit = params.limit ?? 200;
  const hasAi = Boolean(process.env.OPENAI_API_KEY);
  /** Include enough RSS rows to fill the archive list (was capped too low vs `limit`). */
  const summarizeCap = hasAi
    ? Math.min(400, Math.max(limit * 2, 200))
    : Math.min(500, Math.max(limit * 2, 240));

  const mapped = await buildNewsArticleListInPublishedRange(
    tickers,
    params.publishedFromMs,
    params.publishedToMs,
    summarizeCap,
  );

  return mapped
    .sort((a, b) => toTime(b.publishedAt) - toTime(a.publishedAt))
    .slice(0, limit);
}

/**
 * Headlines focused on one ticker (Google News RSS + Finnhub company news + business feeds).
 */
export async function getNewsForTicker(ticker: string, limit = 8): Promise<NewsArticle[]> {
  const t = ticker.trim().toUpperCase();
  if (!t) return [];

  const gNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`${t} stock`)}&hl=en-US&gl=US&ceid=US:en`;

  const [googleItems, feedItems, finnhubItems] = await Promise.all([
    fetchRssUrl(gNewsUrl, "Google News"),
    loadFeedItems(),
    fetchFinnhubTickerNews(t),
  ]);

  const fromFeeds = feedItems.filter((item) => {
    const blob = `${item.title} ${item.description}`.toLowerCase();
    const sym = t.toLowerCase();
    return (
      blob.includes(sym) ||
      blob.includes(`${sym}.`) ||
      blob.includes(`$${sym}`)
    );
  });

  const merged = dedupeByLink([...finnhubItems, ...googleItems, ...fromFeeds])
    .filter((item) => publishedWithinWindow(item.pubDate, NEWS_RSS_FETCH_MAX_AGE_MS))
    .sort((a, b) => toTime(b.pubDate) - toTime(a.pubDate));

  const candidates = merged.slice(0, 14).map((item) => ({
    ...item,
    matchedTicker: t,
  }));

  const summaries = await summarizeArticles(candidates);

  const mapped = candidates.map((item, i) => ({
    id: crypto.createHash("sha1").update(`${item.link}-${item.pubDate ?? ""}-${t}`).digest("hex"),
    source: item.source,
    title: item.title,
    url: item.link,
    publishedAt: item.pubDate,
    summary: sanitizePlainText(summaries[i]?.summary ?? fallbackSummary(item), 220),
    keyPoints: summaries[i]?.keyPoints ?? [],
    matchedTicker: t,
    category: classifyCategory(item),
    marketImpact: summaries[i]?.marketImpact ?? inferImpact(item).marketImpact,
    marketImpactRationale:
      summaries[i]?.rationale ?? inferImpact(item).rationale,
  }));

  return mapped
    .filter((a) => publishedWithinWindow(a.publishedAt, NEWS_VISIBLE_MAX_AGE_MS))
    .slice(0, limit);
}

async function fetchRssUrl(url: string, source: string): Promise<RssItem[]> {
  try {
    /** `no-store` so `router.refresh()` on a timer actually pulls new RSS (Data Cache would ignore refresh until revalidate). */
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssXml(xml, source);
  } catch {
    return [];
  }
}

function dedupeByLink(items: RssItem[]): RssItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.link || seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });
}

async function loadFeedItems(maxAgeMs: number = NEWS_RSS_FETCH_MAX_AGE_MS): Promise<RssItem[]> {
  const all = await Promise.all(
    FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, { cache: "no-store" });
        if (!res.ok) return [];
        const xml = await res.text();
        return parseRssXml(xml, feed.source);
      } catch {
        return [];
      }
    }),
  );

  return all
    .flat()
    .filter((item) => publishedWithinWindow(item.pubDate, maxAgeMs))
    .sort((a, b) => toTime(b.pubDate) - toTime(a.pubDate));
}

function getTag(input: string, tag: string): string {
  return rssGetTag(input, tag);
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Decode common HTML entities and non-breaking spaces (RSS often leaves these literal). */
function decodeHtmlEntities(s: string): string {
  const t = s.replace(/&amp;/g, "&");
  return t
    .replace(/\u00a0/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/&#x0*a0;/gi, " ")
    .replace(/&ndash;|&mdash;/gi, "–")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      const code = parseInt(h, 16);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : "";
    });
}

/** Strip embedded links, raw URLs, and tags so RSS snippets don't overflow the UI. */
function sanitizePlainText(raw: string, maxLen = 240): string {
  if (!raw) return "";
  let s = decodeHtmlEntities(raw.trim());
  s = s.replace(/<a\s+[^>]*href=["'][^"']*["'][^>]*>[\s\S]*?<\/a>/gi, " ");
  s = stripHtml(s);
  s = s.replace(/https?:\/\/[^\s<>"')]+/gi, "");
  s = s.replace(/\s+/g, " ").trim();
  if (s.length > maxLen) return `${s.slice(0, maxLen - 1)}…`;
  return s;
}

function parseRssXml(xml: string, source: string): RssItem[] {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
  return items
    .map((item) => {
      const title = sanitizePlainText(decodeXml(getTag(item, "title")), 220);
      const link = decodeXml(getTag(item, "link"));
      const description = sanitizePlainText(decodeXml(getTag(item, "description")), 280);
      const pubDateRaw = decodeXml(getTag(item, "pubDate"));
      const pubDate = pubDateRaw || null;
      if (!title || !link) return null;
      return { title, link, description, pubDate, source };
    })
    .filter((x): x is RssItem => Boolean(x));
}

function tickerMentionedInText(ticker: string, blob: string): boolean {
  const terms = [ticker.toLowerCase(), ...(TICKER_ALIASES[ticker.toUpperCase()] ?? [])];
  return terms.some((term) =>
    new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(blob),
  );
}

function toCandidate(
  item: NormalizedItem & { _forcedTicker?: string },
  tickers: string[],
  mergeRank: number,
  opts?: { archiveMode?: boolean },
) {
  const blob = `${item.title} ${item.description}`.toLowerCase();
  // Watchlist ticker match
  const matchedTicker = tickers.find((t) => tickerMentionedInText(t, blob)) ?? null;
  const isMacro = MACRO_KEYWORDS.some((k) => blob.includes(k));
  const inHeadlineWindow = mergeRank < TOP_MERGED_FEED_SLOTS;

  if (matchedTicker || isMacro || inHeadlineWindow || opts?.archiveMode) {
    // Discovery: tag popular non-watchlist tickers so they appear with a badge in "All"
    const discoveryTicker =
      !matchedTicker
        ? (DISCOVERY_TICKERS.find(
            (d) => !tickers.includes(d) && tickerMentionedInText(d, blob),
          ) ?? null)
        : null;
    return { ...item, matchedTicker: matchedTicker ?? discoveryTicker };
  }
  return null;
}

async function summarizeArticles(
  items: Array<RssItem & { matchedTicker?: string | null }>,
): Promise<NewsBrief[]> {
  if (!items.length) return [];
  const key = process.env.OPENAI_API_KEY;
  if (!key) return items.map((item) => fallbackBrief(item));

  const input = items
    .map(
      (item, idx) =>
        `${idx + 1}. Title: ${item.title}\nDescription: ${item.description || "n/a"}\nSource: ${item.source}`,
    )
    .join("\n\n");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.12,
        messages: [
          {
            role: "system",
            content:
              'For each headline, return JSON { briefs: [{summary, marketImpact, rationale, keyPoints}] } in the same order. marketImpact = how US large-cap / broad risk appetite likely reacts: bullish (tailwind for equities or easier financial conditions), bearish (headwind, risk-off), neutral only if truly balanced or idiosyncratic with no clear S&P read. Avoid labeling everything neutral—use headline tone (beats, surges, routs, layoffs, downgrades, probes). One sentence each for summary and rationale. keyPoints = array of 2-3 short bullet-point strings (plain text, no markdown, under 80 chars each) highlighting the most important details.',
          },
          { role: "user", content: input },
        ],
      }),
      cache: "no-store",
    });

    if (!res.ok) return items.map((item) => fallbackBrief(item));
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return items.map((item) => fallbackBrief(item));
    const parsed = JSON.parse(raw) as { briefs?: NewsBrief[] };
    if (!Array.isArray(parsed.briefs)) return items.map((item) => fallbackBrief(item));
    return parsed.briefs.map((brief, idx) => normalizeBrief(brief, items[idx]!));
  } catch {
    return items.map((item) => fallbackBrief(item));
  }
}

function fallbackSummary(item: Pick<RssItem, "description" | "title">): string {
  const desc = sanitizePlainText(item.description, 220);
  if (desc && normTextBasic(desc) !== normTextBasic(item.title)) return desc;
  // No useful description — derive a short sentence from the headline
  const clean = sanitizePlainText(item.title, 160).replace(/\s+-\s+\w+$/, ""); // strip " - Reuters" suffix
  return `${clean}.`;
}

function normTextBasic(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function fallbackBrief(item: Pick<RssItem, "description" | "title">): NewsBrief {
  const impact = inferImpact(item);
  return reconcileLexicon(
    {
      summary: fallbackSummary(item),
      marketImpact: impact.marketImpact,
      rationale: impact.rationale,
      keyPoints: [],
    },
    item,
  );
}

function headlinePricePressureBearish(blob: string): boolean {
  const commodityOrCrypto =
    /\b(gold|silver|oil|crude|wti|brent|bitcoin|btc|ethereum|natgas|natural\s+gas|copper)\b[\s\S]{0,140}\b(falls?|fell|drop(s|ped|ping)?|declin|slump(s|ed)?|tumble[sd]?|plunge[sd]?|weakens?)\b/i.test(
      blob,
    ) ||
    /\b(falls?|fell|drop(s|ped|ping)?|declin|slump(s|ed)?|tumble[sd]?|plunge[sd]?)\b[\s\S]{0,100}\b(gold|silver|oil|crude|bitcoin|btc|ethereum)\b/i.test(
      blob,
    );
  const equities =
    /\b(stocks?|shares|equities|s\s*&\s*p|s&p|nasdaq|dow(\s+jones)?)\b[\s\S]{0,120}\b(fall|falls|fell|drop|plunge|selloff|rout|tumble[sd]?)\b/i.test(
      blob,
    );
  return commodityOrCrypto || equities;
}

function reconcileLexicon(brief: NewsBrief, item: Pick<RssItem, "description" | "title">): NewsBrief {
  const lex = inferImpact(item);
  const blob = `${item.title} ${item.description}`;

  if (headlinePricePressureBearish(blob)) {
    return {
      ...brief,
      marketImpact: "bearish",
      rationale:
        "Headline centers on falling prices (commodity/equity), not a clean risk-on signal for broad markets.",
    };
  }

  const strongBear =
    /\b(rout|plunge|crash|layoff|layoffs|fraud|default|selloff|warning|probe|investigation|scandal|slump|recession|bankrupt|downgrade|cuts?\s+jobs|job\s+cuts)\b/i.test(
      blob,
    );
  const strongBull =
    /\b(beat(s)?\s+estimates|soar(s|ed)?|surge[sd]?|rall(y|ies)|record\s+high|upgrade(d)?|strong\s+growth|profit\s+jump|raises?\s+guidance)\b/i.test(
      blob,
    );
  if (brief.marketImpact === "neutral" && lex.marketImpact !== "neutral") {
    return { ...brief, marketImpact: lex.marketImpact, rationale: lex.rationale };
  }
  if (brief.marketImpact === "neutral" && strongBear) {
    return {
      ...brief,
      marketImpact: "bearish",
      rationale: "Headline skews negative for risk appetite or corporate fundamentals.",
    };
  }
  if (brief.marketImpact === "neutral" && strongBull) {
    return {
      ...brief,
      marketImpact: "bullish",
      rationale: "Headline skews positive for risk assets or financial conditions.",
    };
  }
  if (strongBear && brief.marketImpact === "bullish") {
    return { ...brief, marketImpact: "bearish", rationale: lex.rationale };
  }
  if (strongBull && brief.marketImpact === "bearish") {
    return { ...brief, marketImpact: "bullish", rationale: lex.rationale };
  }
  return brief;
}

function normalizeBrief(
  brief: Partial<NewsBrief>,
  item: Pick<RssItem, "description" | "title">,
): NewsBrief {
  const fallback = fallbackBrief(item);
  const impact =
    brief.marketImpact === "bullish" ||
    brief.marketImpact === "bearish" ||
    brief.marketImpact === "neutral"
      ? brief.marketImpact
      : fallback.marketImpact;
  const merged: NewsBrief = {
    summary: sanitizePlainText((brief.summary ?? fallback.summary).trim(), 220),
    marketImpact: impact,
    rationale: sanitizePlainText((brief.rationale ?? fallback.rationale).trim(), 200),
    keyPoints: Array.isArray(brief.keyPoints)
      ? brief.keyPoints.filter((p) => typeof p === "string" && p.trim()).map((p) => p.trim().slice(0, 120))
      : [],
  };
  return reconcileLexicon(merged, item);
}

// Weighted term: [phrase, weight]
const BULLISH_SIGNALS: Array<[string, number]> = [
  // Strong beats / earnings
  ["beat expectations", 3], ["beats estimates", 3], ["beat estimates", 3],
  ["topped estimates", 3], ["record earnings", 3], ["earnings beat", 3],
  ["profit jump", 2], ["raised guidance", 2], ["raises guidance", 2],
  ["boosted guidance", 2], ["blowout quarter", 3], ["blowout earnings", 3],
  // Price / momentum
  ["surge", 2], ["surges", 2], ["soar", 2], ["soars", 2], ["rally", 2],
  ["rallies", 2], ["record high", 2], ["all-time high", 2], ["52-week high", 2],
  ["stock higher", 2], ["shares higher", 2], ["shares jump", 2], ["shares surge", 2],
  ["shares soar", 2], ["stock jumps", 2], ["stock soars", 2],
  // Positive news
  ["incredible news", 2], ["great news", 2], ["major deal", 2],
  ["deal closed", 2], ["merger approved", 2], ["acquisition approved", 2],
  ["breakthrough", 2], ["expansion", 1], ["strong growth", 2],
  ["growth accelerat", 1], ["outperform", 2], ["upgrade", 2],
  ["price target raised", 2], ["buy rating", 2], ["strong buy", 2],
  // Macro / monetary
  ["cooling inflation", 2], ["rate cut", 2], ["cuts rates", 2], ["rate cuts", 2],
  ["fed pivot", 2], ["dovish", 2], ["better than expected", 2],
  ["exceeds expectations", 2], ["jobs added", 1], ["unemployment falls", 2],
  // Consumer / economy
  ["consumer confidence rises", 2], ["gdp beats", 2], ["gdp growth", 1],
];

const BEARISH_SIGNALS: Array<[string, number]> = [
  // Misses / guidance cuts
  ["miss estimates", 3], ["misses estimates", 3], ["missed estimates", 3],
  ["revenue miss", 3], ["earnings miss", 3], ["profit warning", 3],
  ["lowered guidance", 3], ["cuts guidance", 3], ["reduced guidance", 3],
  // Price / momentum
  ["plunge", 2], ["plunges", 2], ["rout", 2], ["crash", 2], ["tumble", 2],
  ["tumbles", 2], ["slump", 2], ["slumps", 2], ["selloff", 2], ["sell-off", 2],
  ["drops sharply", 2], ["falls sharply", 2], ["dives", 2],
  // Corporate negatives
  ["layoff", 2], ["layoffs", 2], ["job cuts", 2], ["mass layoff", 2],
  ["workforce reduction", 2], ["warns", 2], ["warning", 2],
  ["probe", 2], ["investigation", 2], ["fraud", 3], ["default", 2],
  ["bankrupt", 3], ["bankruptcy", 3], ["insolvency", 2],
  ["downgrade", 2], ["sell rating", 2], ["price target cut", 2], ["underperform", 2],
  // Macro / monetary
  ["recession", 2], ["hot inflation", 2], ["hawkish", 2],
  ["rate hike", 2], ["raises rates", 2], ["rate hikes", 2],
  ["tariff", 2], ["tariffs", 2], ["sanction", 2], ["sanctions", 2],
  ["trade war", 2], ["trade conflict", 2],
  // Geopolitical / risk-off
  ["attack", 1], ["war", 1], ["conflict", 1], ["military", 1],
  ["deep concerns", 2], ["grave concerns", 2], ["geopolitical risk", 2],
  ["strait of hormuz", 2], ["escalation", 2], ["oil supply", 1],
  ["supply disruption", 2], ["supply chain", 1], ["shortage", 1],
  // Economy
  ["gdp shrinks", 2], ["gdp contracts", 2], ["unemployment rises", 2],
  ["consumer confidence falls", 2], ["retail sales drop", 2],
];

function inferImpact(item: Pick<RssItem, "description" | "title">): {
  marketImpact: "bullish" | "bearish" | "neutral";
  rationale: string;
} {
  const blob = `${item.title} ${item.description}`.toLowerCase();
  const bullScore = BULLISH_SIGNALS.reduce((acc, [t, w]) => acc + (blob.includes(t) ? w : 0), 0);
  const bearScore = BEARISH_SIGNALS.reduce((acc, [t, w]) => acc + (blob.includes(t) ? w : 0), 0);

  // Require a minimum score margin to avoid neutral-inflation
  if (bullScore > bearScore && bullScore >= 2) {
    return {
      marketImpact: "bullish",
      rationale: "Headline skews positive for risk assets or financial conditions.",
    };
  }
  if (bearScore > bullScore && bearScore >= 2) {
    return {
      marketImpact: "bearish",
      rationale: "Headline skews negative for risk appetite or corporate fundamentals.",
    };
  }
  // Weak signals: lean toward the higher side even at score 1
  if (bullScore > bearScore) {
    return { marketImpact: "bullish", rationale: "Slight positive lean in headline tone." };
  }
  if (bearScore > bullScore) {
    return { marketImpact: "bearish", rationale: "Slight negative lean in headline tone." };
  }
  return {
    marketImpact: "neutral",
    rationale: "Mixed or company-specific read without a clear broad-market tilt.",
  };
}

function classifyCategory(
  item: Pick<RssItem, "title" | "description">,
): NewsArticle["category"] {
  const blob = `${item.title} ${item.description}`.toLowerCase();
  if (
    hasAny(blob, [
      "fed",
      "cpi",
      "inflation",
      "jobs report",
      "gdp",
      "yield",
      "housing",
      "mortgage",
      "home sales",
      "case-shiller",
    ])
  ) {
    return "economics";
  }
  if (hasAny(blob, ["consumer", "retail", "spending", "household", "walmart", "target"])) {
    return "consumers";
  }
  if (hasAny(blob, ["sec", "regulation", "policy", "white house", "tariff", "congress"])) {
    return "policy";
  }
  if (hasAny(blob, ["stocks", "bond", "treasury", "s&p", "nasdaq", "dow", "market"])) {
    return "markets";
  }
  return "companies";
}

function hasAny(blob: string, words: string[]): boolean {
  return words.some((w) => blob.includes(w));
}

function decodeXml(s: string): string {
  return decodeHtmlEntities(s);
}

function toTime(s: string | null): number {
  if (!s) return 0;
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}
