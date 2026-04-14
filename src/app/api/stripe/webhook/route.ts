import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

// Use service-role key to bypass RLS for webhook updates
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.supabase_user_id;
      if (userId && session.subscription) {
        await supabase.from("profiles").update({
          subscription_tier: "pro",
          stripe_subscription_id: session.subscription as string,
        }).eq("id", userId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) break;
      const isActive = ["active", "trialing"].includes(sub.status);
      await supabase.from("profiles").update({
        subscription_tier: isActive ? "pro" : "free",
        subscription_period_end: new Date(((sub as unknown) as { current_period_end: number }).current_period_end * 1000).toISOString(),
      }).eq("id", userId);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const userId = sub.metadata?.supabase_user_id;
      if (userId) {
        await supabase.from("profiles").update({
          subscription_tier: "free",
          stripe_subscription_id: null,
        }).eq("id", userId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
