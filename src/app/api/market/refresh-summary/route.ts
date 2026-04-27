import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMarketSummary } from "@/lib/market-summary";
import { getUserTier } from "@/lib/subscription";

export const dynamic = "force-dynamic";

/** Pro-only: force-clear and regenerate the daily AI market summary. */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tier = await getUserTier(supabase, user.id, user.email);
  if (tier !== "pro") {
    return NextResponse.json({ error: "Pro required" }, { status: 403 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 503 });
  }

  try {
    const admin = createAdminClient();
    await admin.from("market_summaries").delete().eq("period", "daily");
    const result = await getMarketSummary();
    return NextResponse.json({ ok: true, generatedAt: result?.generatedAt });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
