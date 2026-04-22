/**
 * Low-level Gemini 2.0 Flash helper.
 * Builds a market-data prompt and returns the generated summary text.
 */

import { fetchMarketHomeData } from "@/lib/market-home-data";
import { getNewsBriefing } from "@/lib/news";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function generateMarketSummaryText(): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  // Fetch market data + recent headlines in parallel
  const [data, articles] = await Promise.all([
    fetchMarketHomeData(),
    getNewsBriefing({ tickers: [], limit: 6, candidateCap: 10 }).catch(() => []),
  ]);

  // ── Build context strings ───────────────────────────────────────────────────

  const benchmarkText = data.benchmarks
    .map((b) => {
      const pct = `${b.changePct >= 0 ? "+" : ""}${b.changePct.toFixed(2)}%`;
      const px =
        b.price != null
          ? ` at ${b.price >= 1_000 ? b.price.toFixed(0) : b.price.toFixed(2)}`
          : "";
      return `${b.label} (${b.symbol}): ${pct}${px}`;
    })
    .join("\n");

  const gainerText = data.gainers
    .slice(0, 5)
    .map((g) => `${g.symbol} +${g.changePct.toFixed(1)}%`)
    .join(", ");

  const loserText = data.losers
    .slice(0, 5)
    .map((l) => `${l.symbol} ${l.changePct.toFixed(1)}%`)
    .join(", ");

  const headlineText = articles.length
    ? articles
        .slice(0, 6)
        .map((a) => `• [${a.marketImpact}] ${a.title} (${a.source})`)
        .join("\n")
    : "No headlines available.";

  // ── Prompt ──────────────────────────────────────────────────────────────────

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

  // ── Call Gemini ─────────────────────────────────────────────────────────────

  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.65, maxOutputTokens: 450 },
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const text: string | undefined =
    json.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error("Unexpected Gemini response shape");
  return text.trim();
}
