"use server";

import { generateWeeklySummaryText } from "@/lib/gemini-summary";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/** Force-regenerate the weekly market recap and revalidate the archive page. */
export async function refreshWeeklyMarketSummary() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured on this server.");
  }

  const summary = await generateWeeklySummaryText();
  const generatedAt = new Date().toISOString();

  const admin = createAdminClient();
  await admin
    .from("market_summaries")
    .upsert({ period: "weekly", summary, generated_at: generatedAt }, { onConflict: "period" });

  revalidatePath("/dashboard/archive");
}
