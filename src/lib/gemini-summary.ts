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

export async function generateMarketSummaryText(): Promise<string> {
  const [data, articles] = await Promise.all([
    fetchMarketHomeData(),
    getNewsBriefing({ tickers: [], limit: 6, candidateCap: 10 }).catch(() => []),
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
  const headlineText = articles.length
    ? articles.slice(0, 6).map((a) => `• [${a.marketImpact}] ${a.title} (${a.source})`).join("\n")
    : "No headlines available.";

  const prompt = `You are a concise financial analyst writing a daily market briefing for everyday investors.

MARKET BENCHMARKS (today):
${benchmarkText}

TOP GAINERS: ${gainerText}
TOP LOSERS:  ${loserText}

RECENT HEADLINES:
${headlineText}

Write a 150–200 word market summary in 2–3 short paragraphs. No headers, no bullet points.
1. Open with the overall market direction and key index moves.
2. Explain which sectors or themes drove the biggest moves and WHY — tie in the headlines as context.
3. Close with one sentence on what investors should watch next.

Be specific with tickers and percentages where they add clarity. Write clearly for a retail investor.`;

  return callGroq(prompt, 450);
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
