import { NextResponse } from "next/server";
import { getMarketSummary, getWeeklyMarketSummary } from "@/lib/market-summary";

/**
 * Vercel Cron: proactively regenerate the daily AI market summary.
 * Runs every 6 hours on weekdays so the summary is always fresh when users arrive.
 * Protected by CRON_SECRET (set in Vercel env vars).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Cron disabled: set CRON_SECRET in the deployment environment." },
      { status: 503 },
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not set — skipping." }, { status: 503 });
  }

  try {
    // Force-expire cache by deleting the row so getMarketSummary regenerates
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin.from("market_summaries").delete().eq("period", "daily");

    const [daily, weekly] = await Promise.allSettled([
      getMarketSummary(),
      getWeeklyMarketSummary(),
    ]);

    return NextResponse.json({
      daily:  daily.status  === "fulfilled" ? "ok" : daily.reason,
      weekly: weekly.status === "fulfilled" ? "ok" : weekly.reason,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/market-summary]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
