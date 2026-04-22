"use server";

import { generateMarketSummaryText } from "@/lib/gemini-summary";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/** Force-regenerate the daily market summary and revalidate the home page. */
export async function refreshMarketSummary() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured on this server.");
  }

  const summary = await generateMarketSummaryText();
  const generatedAt = new Date().toISOString();

  const admin = createAdminClient();
  await admin
    .from("market_summaries")
    .upsert({ period: "daily", summary, generated_at: generatedAt }, { onConflict: "period" });

  revalidatePath("/home");
}
