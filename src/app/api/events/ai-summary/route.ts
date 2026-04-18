import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? "").trim().slice(0, 200);
  const date = (searchParams.get("date") ?? "").trim().slice(0, 30);
  const eventType = (searchParams.get("eventType") ?? "macro").trim();

  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({
      summary: "AI summaries require an OpenAI API key to be configured.",
    });
  }

  const dateStr = date
    ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "the past";

  const typeHint =
    eventType === "earnings"
      ? "earnings report"
      : eventType === "macro"
        ? "macroeconomic event"
        : "market catalyst";

  const prompt = `You are a financial analyst with knowledge of market events through your training cutoff.

The following ${typeHint} occurred on or around ${dateStr}: "${title}"

In 1-2 concise sentences, summarize what actually happened — the key outcome, data point, or decision. Be specific with numbers where you know them (e.g. "Fed cut rates from 5.25% to 5.00%", "CPI came in at 3.2% vs 3.4% expected"). If you don't have reliable information about this specific event, say "Outcome data not available in training set." Do not speculate or make up numbers.

Respond with JSON: { "summary": "..." }`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        messages: [{ role: "user", content: prompt }],
      }),
      cache: "no-store",
    });

    if (!res.ok) throw new Error("OpenAI error");
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw) as { summary?: string };
    return NextResponse.json({ summary: parsed.summary ?? "" });
  } catch {
    return NextResponse.json({ summary: "Could not generate summary at this time." });
  }
}
