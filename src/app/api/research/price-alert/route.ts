import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tier = await getUserTier(supabase, user.id, user.email);
  if (tier !== "pro") return NextResponse.json({ error: "Pro required" }, { status: 403 });

  const body = (await request.json()) as { symbol?: string; targetPrice?: number; direction?: string };
  const { symbol, targetPrice, direction } = body;
  if (!symbol || !targetPrice || !direction) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { error } = await supabase.from("price_alerts").insert({
    user_id: user.id,
    symbol: symbol.toUpperCase(),
    target_price: targetPrice,
    direction,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
