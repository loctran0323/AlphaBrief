import { NextResponse } from "next/server";
import { isValidTickerSymbol } from "@/lib/ticker-symbol";
import { getNewsForTicker } from "@/lib/news";

export const dynamic = "force-dynamic";

const GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "").trim().toUpperCase();
  const changePctRaw = searchParams.get("changePct");
  const priceRaw = searchParams.get("price");

  if (!symbol || !isValidTickerSymbol(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 400 });
  }

  const changePct = changePctRaw != null ? parseFloat(changePctRaw) : null;
  const price = priceRaw != null ? parseFloat(priceRaw) : null;

  const articles = await getNewsForTicker(symbol, 5);

  const direction =
    changePct == null ? null
    : changePct > 0 ? "up"
    : changePct < 0 ? "down"
    : "flat";

  const priceStr =
    price != null && changePct != null
      ? `$${price.toFixed(2)} (${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}% today)`
      : null;

  const key = process.env.GROQ_API_KEY;

  if (!key) {
    // Fallback: plain sentence from price + top headline (no AI)
    const top = articles[0];
    let summary = "";
    if (priceStr && direction) {
      summary = `${symbol} is ${direction === "flat" ? "flat" : direction} at ${priceStr}.`;
      if (top) summary += ` Latest: ${top.title}`;
    } else if (top) {
      summary = top.title;
    } else {
      summary = `No recent headlines found for ${symbol}.`;
    }
    return NextResponse.json({
      summary,
      sentiment: direction === "up" ? "bullish" : direction === "down" ? "bearish" : "neutral",
    });
  }

  const headlineCtx = articles.length
    ? articles.map((a, i) => `${i + 1}. ${a.title}${a.summary && a.summary !== a.title ? ` — ${a.summary}` : ""}`).join("\n")
    : "No recent headlines available.";

  const priceCtx = priceStr
    ? `${symbol} is trading at ${priceStr}.`
    : `No price data available for ${symbol}.`;

  const prompt = `${priceCtx}

Recent headlines:
${headlineCtx}

In 2 sentences, explain why ${symbol} is likely ${direction === "up" ? "up" : direction === "down" ? "down" : "moving the way it is"} today based on the headlines above. Be specific — reference the actual news if relevant. If no clear catalyst, say so honestly.

Respond with JSON only, no markdown: { "summary": "..." }`;

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = (data.choices?.[0]?.message?.content ?? "")
      .replace(/^```[a-z]*\n?/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(raw) as { summary?: string };
    return NextResponse.json({
      summary: parsed.summary ?? "",
      sentiment: direction === "up" ? "bullish" : direction === "down" ? "bearish" : "neutral",
    });
  } catch {
    const top = articles[0];
    return NextResponse.json({
      summary: priceStr
        ? `${symbol} is ${direction} at ${priceStr}.${top ? ` Latest: ${top.title}` : ""}`
        : `Could not generate analysis for ${symbol}.`,
      sentiment: direction === "up" ? "bullish" : direction === "down" ? "bearish" : "neutral",
    });
  }
}
