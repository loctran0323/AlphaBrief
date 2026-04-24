import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";
import { ManageBillingButton } from "./manage-billing-button";
import Link from "next/link";

export const metadata: Metadata = { title: "Subscription — AlphaBrief" };

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  return admins.includes(email.toLowerCase());
}

const planRows = [
  { label: "Home market view",          free: true,         pro: true },
  { label: "Dashboard & news briefing", free: true,         pro: true },
  { label: "Market map lookups",        free: "3 / day",    pro: "Unlimited" },
  { label: "Research news per ticker",  free: "3 articles", pro: "Full feed" },
  { label: "Price alerts via email",    free: false,        pro: true },
  { label: "Email digest",              free: false,        pro: true },
  { label: "Archive (past timeline)",   free: false,        pro: true },
  { label: "Community chat",            free: true,         pro: true },
];

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const tier = user ? await getUserTier(supabase, user.id, user.email) : "free";
  const isPro = tier === "pro";
  const isAdmin = isAdminEmail(user?.email);

  return (
    <div style={{ maxWidth: 680, fontFamily: SANS_L }}>

      {/* Masthead */}
      <div style={{ borderBottom: "2px solid var(--ab-fg)", paddingBottom: 20, marginBottom: 32 }}>
        <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: ACCENT, fontWeight: 700, marginBottom: 10 }}>
          Account
        </div>
        <h1 style={{ fontFamily: SERIF_L, fontSize: 42, fontWeight: 600, letterSpacing: "-.02em", lineHeight: 1.05, margin: 0, color: "var(--ab-fg)" }}>
          Subscription
        </h1>
        <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 16, color: "var(--ab-muted)", marginTop: 10, marginBottom: 0 }}>
          Manage your plan and billing details.
        </p>
      </div>

      {/* Current plan */}
      <div style={{ borderTop: "1px solid var(--ab-border)", paddingTop: 24, marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontFamily: SERIF_L, fontSize: 20, fontWeight: 600, color: "var(--ab-fg)" }}>Current plan</div>
          <span style={{
            fontFamily: SANS_L, fontSize: 9, fontWeight: 700,
            letterSpacing: ".12em", textTransform: "uppercase",
            color: isPro ? ACCENT : "var(--ab-faint)",
            border: `1px solid ${isPro ? ACCENT : "var(--ab-border)"}`,
            padding: "2px 8px",
          }}>{isPro ? "Pro" : "Free"}</span>
        </div>
        <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 15, color: "var(--ab-muted)", marginBottom: 0 }}>
          {isPro
            ? "Full access — unlimited map lookups, archive, email digest, and priority features."
            : "3 market map lookups per day. Upgrade for full access."}
        </p>
      </div>

      {/* Plan comparison table */}
      <div style={{ borderTop: "1px solid var(--ab-border)", marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", borderBottom: "1px solid var(--ab-fg)" }}>
          <div style={{ padding: "8px 0", fontFamily: SANS_L, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ab-faint)" }} />
          <div style={{ padding: "8px 0", textAlign: "center", fontFamily: SANS_L, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ab-faint)" }}>Free</div>
          <div style={{ padding: "8px 0", textAlign: "center", fontFamily: SANS_L, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: ACCENT }}>Pro</div>
        </div>
        {planRows.map((row, i) => (
          <div key={row.label} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", borderBottom: "1px solid var(--ab-border)", padding: "10px 0" }}>
            <div style={{ fontFamily: SERIF_L, fontSize: 14, color: "var(--ab-fg)" }}>{row.label}</div>
            <div style={{ textAlign: "center", fontFamily: SANS_L, fontSize: 12, color: row.free === false ? "var(--ab-faint)" : "var(--ab-up)", fontWeight: 600 }}>
              {row.free === false ? "—" : row.free === true ? "✓" : row.free}
            </div>
            <div style={{ textAlign: "center", fontFamily: SANS_L, fontSize: 12, color: ACCENT, fontWeight: 600 }}>
              {row.pro === true ? "✓" : row.pro}
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade / Billing */}
      {isPro ? (
        !isAdmin && (
          <div style={{ borderTop: "1px solid var(--ab-border)", paddingTop: 24, marginBottom: 32 }}>
            <div style={{ fontFamily: SERIF_L, fontSize: 20, fontWeight: 600, marginBottom: 6, color: "var(--ab-fg)" }}>
              Billing &amp; cancellation
            </div>
            <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 14, color: "var(--ab-muted)", marginBottom: 20 }}>
              Update your payment method, download invoices, or cancel from the Stripe billing portal.
            </p>
            <ManageBillingButton />
          </div>
        )
      ) : (
        <div style={{ border: `1px solid ${ACCENT}`, padding: "24px 28px", marginBottom: 32 }}>
          <div style={{ fontFamily: SERIF_L, fontSize: 20, fontWeight: 600, color: "var(--ab-fg)", marginBottom: 8 }}>
            Upgrade to Pro — $9/month
          </div>
          <p style={{ fontFamily: SERIF_L, fontSize: 15, color: "var(--ab-muted)", lineHeight: 1.6, marginBottom: 16 }}>
            Unlock the full archive, unlimited market map lookups, and email digest. Beta price locked in for early supporters.
          </p>
          <Link href="/dashboard/upgrade" style={{
            display: "inline-block",
            fontFamily: SANS_L, fontSize: 11, fontWeight: 600,
            letterSpacing: ".08em", textTransform: "uppercase",
            color: "#fff", background: ACCENT, padding: "8px 18px", textDecoration: "none",
          }}>
            See Pro plan
          </Link>
        </div>
      )}

      <Link href="/dashboard" style={{ fontFamily: SANS_L, fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ab-muted)", textDecoration: "none" }}>
        ← Back to Dashboard
      </Link>
    </div>
  );
}
