/**
 * AI summary helpers — uses Groq (Llama 3.3 70B) via OpenAI-compatible API.
 * Exports both a daily summary and a weekly recap generator.
 */

import { fetchMarketHomeData } from "@/lib/market-home-data";
import { getNewsBriefing, getArchivedNewsBriefing } from "@/lib/news";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

async function callGroq(prompt: string, maxTokens: number): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.65,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const text: string | undefined = json.choices?.[0]?.message?.content;
  if (!text) throw new Error("Unexpected Groq response shape");
  return text.trim();
}

// ── Daily summary ────────────────────────────────────────────────────────────

function getMarketSessionContext(): { isOpen: boolean; label: string } {
  // US Eastern time
  const now = new Date();
  const etOffset = -5; // EST; DST not critical for this purpose
  const etHour = (now.getUTCHours() + 24 + etOffset) % 24;
  const day = now.getUTCDay(); // 0=Sun, 6=Sat
  const isWeekend = day === 0 || day === 6;
  const isMarketHours = !isWeekend && etHour >= 9 && etHour < 16;
  const isAfterHours = !isWeekend && (etHour >= 16 || etHour < 9);

  if (isMarketHours) return { isOpen: true, label: "during regular trading hours" };
  if (isAfterHours) return { isOpen: false, label: "after market close" };
  return { isOpen: false, label: "over the weekend" };
}

export async function generateMarketSummaryText(): Promise<string> {
  const session = getMarketSessionContext();

  const [data, articles, recentArticles] = await Promise.all([
    fetchMarketHomeData(),
    getNewsBriefing({ tickers: [], limit: 12, candidateCap: 20 }).catch(() => []),
    // Pull last 3 hours of news separately to surface after-hours developments
    getArchivedNewsBriefing({
      tickers: [],
      limit: 8,
      publishedFromMs: Date.now() - 3 * 60 * 60 * 1000,
      publishedToMs: Date.now(),
    }).catch(() => []),
  ]);

  const benchmarkText = data.benchmarks
    .map((b) => {
      const pct = `${b.changePct >= 0 ? "+" : ""}${b.changePct.toFixed(2)}%`;
      const px = b.price != null ? ` at ${b.price >= 1_000 ? b.price.toFixed(0) : b.price.toFixed(2)}` : "";
      return `${b.label} (${b.symbol}): ${pct}${px}`;
    })
    .join("\n");

  const gainerText = data.gainers.slice(0, 5).map((g) => `${g.symbol} +${g.changePct.toFixed(1)}%`).join(", ");
  const loserText = data.losers.slice(0, 5).map((l) => `${l.symbol} ${l.changePct.toFixed(1)}%`).join(", ");

  // Merge recent + broader headlines, deduplicate
  const allArticles = [...recentArticles, ...articles]
    .filter((a, i, arr) => arr.findIndex((x) => x.title === a.title) === i)
    .slice(0, 12);

  const headlineText = allArticles.length
    ? allArticles.map((a) => {
        const age = a.publishedAt
          ? `${Math.round((Date.now() - new Date(a.publishedAt).getTime()) / 60000)}m ago`
          : "";
        return `• [${a.marketImpact}] ${a.title} (${a.source}${age ? `, ${age}` : ""})`;
      }).join("\n")
    : "No headlines available.";

  const sessionNote = session.isOpen
    ? "Markets are currently open."
    : `Markets are closed (${session.label}). Use the most recent headlines to surface what happened after the bell, any geopolitical or macro developments, and what investors should watch when markets reopen. Do not focus on intraday % moves if markets are closed — instead focus on the news flow and what it means for the next session.`;

  const prompt = `You are a concise financial analyst writing a market briefing for everyday investors. Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.

${sessionNote}

MARKET BENCHMARKS (most recent close):
${benchmarkText}

TOP GAINERS (last session): ${gainerText}
TOP LOSERS (last session):  ${loserText}

RECENT HEADLINES (newest first):
${headlineText}

Write a structured market summary using exactly these four bold section headers:

**MARKET SNAPSHOT**
One sentence on where markets stand — if open, today's direction; if closed, how the last session ended and current futures/sentiment.

**WHAT'S DRIVING IT**
2–3 bullet points on the main themes and catalysts. If after-hours or weekend, focus on geopolitical developments, macro announcements, earnings after the bell, or anything that could move markets at open. Be specific — name the event and why it matters.

**KEY MOVERS**
2–3 bullet points on notable stocks or sectors. Include any after-hours movers, earnings reactions, or news-driven moves.

**WATCH FOR**
1–2 bullet points on what to monitor next — upcoming economic data, Fed speakers, earnings, or geopolitical flashpoints that could set the tone for the next session.

Keep it tight and specific. Write clearly for a retail investor. Total length: 180–250 words.`;

  return callGroq(prompt, 600);
}

// ── Trending queries ──────────────────────────────────────────────────────────

export async function generateTrendingQueriesText(): Promise<string> {
  const [data, articles] = await Promise.all([
    fetchMarketHomeData(),
    getNewsBriefing({ tickers: [], limit: 8, candidateCap: 12 }).catch(() => []),
  ]);

  const gainerText = data.gainers.slice(0, 5).map((g) => `${g.symbol} +${g.changePct.toFixed(1)}%`).join(", ");
  const loserText  = data.losers.slice(0, 5).map((l) => `${l.symbol} ${l.changePct.toFixed(1)}%`).join(", ");
  const headlineText = articles.length
    ? articles.slice(0, 8).map((a) => `• ${a.title}`).join("\n")
    : "No headlines.";

  const prompt = `You are a financial data analyst. Based on today's market movers and headlines, generate exactly 4 trending investor research queries — the kinds of things that people are searching right now because of current market events.

TODAY'S TOP GAINERS: ${gainerText}
TODAY'S TOP LOSERS:  ${loserText}

CURRENT HEADLINES:
${headlineText}

Return ONLY valid JSON — an array of 4 objects, no markdown, no explanation:
[
  { "q": "short search query tied to a current mover or theme", "d": "+NNN%" },
  { "q": "...", "d": "+NN%" },
  { "q": "...", "d": "+NN%" },
  { "q": "...", "d": "+NN%" }
]

Rules:
- Each query should be 3–6 words, specific, tied to today's news or movers
- "d" is a simulated search-volume spike (e.g. "+187%"), ranging from +40% to +300%
- Highest spike = most newsworthy topic today
- No stock prices, no percentages in the query text itself`;

  return callGroq(prompt, 200);
}

// ── Weekly recap ─────────────────────────────────────────────────────────────

export async function generateWeeklySummaryText(): Promise<string> {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const [data, weeklyArticles, todayArticles] = await Promise.all([
    fetchMarketHomeData(),
    getArchivedNewsBriefing({
      tickers: [],
      limit: 15,
      publishedFromMs: sevenDaysAgo,
      publishedToMs: Date.now(),
    }).catch(() => []),
    getNewsBriefing({ tickers: [], limit: 5, candidateCap: 8 }).catch(() => []),
  ]);

  const benchmarkText = data.benchmarks
    .map((b) => {
      const pct = `${b.changePct >= 0 ? "+" : ""}${b.changePct.toFixed(2)}%`;
      const px = b.price != null ? ` at ${b.price >= 1_000 ? b.price.toFixed(0) : b.price.toFixed(2)}` : "";
      return `${b.label} (${b.symbol}): ${pct}${px}`;
    })
    .join("\n");

  // Combine and deduplicate articles, sort by date
  const allArticles = [...todayArticles, ...weeklyArticles]
    .filter((a, i, arr) => arr.findIndex((x) => x.title === a.title) === i)
    .slice(0, 18);

  const headlineText = allArticles.length
    ? allArticles
        .map((a) => {
          const date = a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "";
          return `• [${a.marketImpact}] ${a.title}${date ? ` (${date}, ${a.source})` : ` (${a.source})`}`;
        })
        .join("\n")
    : "No headlines available for this week.";

  const gainerText = data.gainers.slice(0, 5).map((g) => `${g.symbol} +${g.changePct.toFixed(1)}%`).join(", ");
  const loserText = data.losers.slice(0, 5).map((l) => `${l.symbol} ${l.changePct.toFixed(1)}%`).join(", ");

  const prompt = `You are a senior market analyst writing a weekly market recap for retail investors. Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.

CURRENT MARKET LEVELS:
${benchmarkText}

TODAY'S MOVERS — Top gainers: ${gainerText} | Top losers: ${loserText}

THIS WEEK'S HEADLINES (past 7 days, with dates):
${headlineText}

Write a structured weekly market recap of 300–400 words using exactly these four section headers in bold:

**WEEKLY OVERVIEW**
How did the major indices perform this week overall? Describe the week's character — was it volatile, a reversal, a grind higher, a selloff? Give the general arc of the week (early week vs. late week if it shifted).

**KEY THEMES & DRIVERS**
What were the 2–3 biggest themes driving markets this week? Which sectors led and which lagged? Use specific headlines as evidence for WHY price action moved the way it did. Be analytical — connect news to market behavior.

**MARKET SIGNAL**
Identify the single most important signal or shift this week. What is the market currently pricing in or how has its psychology shifted? What does this week's price action reveal about how investors are thinking right now?

**WEEK AHEAD**
What are the key catalysts to watch next week? Name specific upcoming earnings reports, economic data releases (CPI, PPI, jobs, Fed speakers), or geopolitical developments that could move markets.

Be specific with tickers, index levels, and percentages. Write analytically — not like a blog, but like a sharp weekly briefing from a buy-side analyst. No fluff.`;

  return callGroq(prompt, 800);
}
