import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";
import { UpgradeButton } from "./upgrade-button";

export const metadata: Metadata = { title: "Upgrade to Pro — AlphaBrief" };

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

type Row = { label: string; sub?: string; free: string | boolean; pro: string | boolean };

const planRows: Row[] = [
  { label: "Home market view",           free: true,         pro: true },
  { label: "Dashboard & news briefing",  free: true,         pro: true },
  { label: "Market map lookups",         sub: "AI-powered stock analysis on click",    free: "3 / day",    pro: "Unlimited" },
  { label: "Research — news per ticker", sub: "AI-tagged headlines on any stock",      free: "3 articles", pro: "Full feed" },
  { label: "Price alerts",               sub: "Email when a stock hits your target",   free: false,        pro: true },
  { label: "Email digest",               sub: "Daily briefing delivered to your inbox",free: false,        pro: true },
  { label: "Archive",                    sub: "Past timeline events & historical news", free: false,       pro: true },
  { label: "Community chat",             sub: "Live chat with other AlphaBrief users", free: true,         pro: true },
  { label: "Pro badge in community",     free: false,        pro: true },
  { label: "Priority new features",      sub: "First access to everything we ship",    free: false,        pro: true },
  { label: "Support the mission",        sub: "Funds better APIs, data & infrastructure", free: false,     pro: true },
];

function Cell({ value, accent = false }: { value: string | boolean; accent?: boolean }) {
  if (value === true) return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"
      style={{ display: "block", margin: "0 auto", color: accent ? ACCENT : "var(--ab-up)" }}>
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
  if (value === false) return (
    <span style={{ display: "block", textAlign: "center", color: "var(--ab-faint)" }}>—</span>
  );
  return (
    <span style={{
      display: "block", textAlign: "center",
      fontFamily: SANS_L, fontSize: 12, fontWeight: 700,
      color: accent ? ACCENT : "var(--ab-fg)",
    }}>{value}</span>
  );
}

export default async function UpgradePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const tier = user ? await getUserTier(supabase, user.id, user.email) : "free";

  if (tier === "pro") {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", paddingBottom: 64, textAlign: "center" }}>
        <div style={{ marginTop: 40, border: "1px solid var(--ab-up)", padding: "40px 32px" }}>
          <div style={{ fontFamily: SERIF_L, fontSize: 24, fontWeight: 600, color: "var(--ab-fg)", marginBottom: 10 }}>
            You&apos;re on Pro
          </div>
          <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 15, color: "var(--ab-muted)", margin: 0 }}>
            You have full access to all Pro features. Thank you for supporting AlphaBrief.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", paddingBottom: 64, fontFamily: SANS_L }}>

      {/* Masthead */}
      <div style={{ borderBottom: "2px solid var(--ab-fg)", paddingBottom: 20, marginBottom: 32, textAlign: "center" }}>
        <div style={{
          display: "inline-block", marginBottom: 14,
          fontFamily: SANS_L, fontSize: 10, fontWeight: 700,
          letterSpacing: ".16em", textTransform: "uppercase",
          color: ACCENT, border: `1px solid ${ACCENT}`,
          padding: "3px 10px",
        }}>
          Beta pricing — lock in forever
        </div>
        <h1 style={{
          fontFamily: SERIF_L, fontSize: 46, fontWeight: 600,
          letterSpacing: "-.02em", lineHeight: 1.05,
          margin: "0 0 12px", color: "var(--ab-fg)",
        }}>
          Compare plans
        </h1>
        <p style={{
          fontFamily: SERIF_L, fontStyle: "italic", fontSize: 16,
          color: "var(--ab-muted)", margin: "0 auto", maxWidth: 520,
        }}>
          Every Pro subscription directly funds better data APIs, faster infrastructure, and new features.
          You&apos;re not just upgrading — you&apos;re helping build something better.
        </p>
      </div>

      {/* Comparison table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS_L }}>
        {/* Column headers */}
        <thead>
          <tr style={{ borderBottom: "2px solid var(--ab-fg)" }}>
            <th style={{
              width: "55%", padding: "10px 0 12px",
              textAlign: "left", fontFamily: SANS_L,
              fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase",
              color: "var(--ab-faint)", fontWeight: 700,
            }}>Feature</th>
            <th style={{ width: "22.5%", padding: "10px 0 12px", textAlign: "center" }}>
              <div style={{ fontFamily: SANS_L, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ab-faint)", fontWeight: 700, marginBottom: 4 }}>Free</div>
              <div style={{ fontFamily: SERIF_L, fontSize: 28, fontWeight: 600, color: "var(--ab-fg)", lineHeight: 1 }}>$0</div>
              <div style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 12, color: "var(--ab-faint)", marginTop: 2 }}>/month</div>
            </th>
            <th style={{ width: "22.5%", padding: "10px 0 12px", textAlign: "center", borderBottom: `2px solid ${ACCENT}`, borderLeft: `1px solid ${ACCENT}`, borderRight: `1px solid ${ACCENT}` }}>
              <div style={{ fontFamily: SANS_L, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: ACCENT, fontWeight: 700, marginBottom: 4 }}>Pro</div>
              <div style={{ fontFamily: SERIF_L, fontSize: 28, fontWeight: 600, color: "var(--ab-fg)", lineHeight: 1 }}>$9</div>
              <div style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 12, color: "var(--ab-faint)", marginTop: 2 }}>/month</div>
            </th>
          </tr>
        </thead>

        <tbody>
          {planRows.map((row) => (
            <tr key={row.label} style={{ borderBottom: "1px solid var(--ab-border)" }}>
              <td style={{ padding: "12px 0" }}>
                <div style={{ fontFamily: SERIF_L, fontSize: 14, fontWeight: 600, color: "var(--ab-fg)" }}>{row.label}</div>
                {row.sub && <div style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 12, color: "var(--ab-faint)", marginTop: 2 }}>{row.sub}</div>}
              </td>
              <td style={{ padding: "12px 0", textAlign: "center" }}>
                <Cell value={row.free} />
              </td>
              <td style={{
                padding: "12px 0", textAlign: "center",
                borderLeft: `1px solid ${ACCENT}`, borderRight: `1px solid ${ACCENT}`,
                background: "rgba(108,92,231,.04)",
              }}>
                <Cell value={row.pro} accent />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* CTA */}
      <div style={{ marginTop: 36, textAlign: "center" }}>
        <UpgradeButton />
        <p style={{
          marginTop: 12, fontFamily: SERIF_L, fontStyle: "italic",
          fontSize: 12, color: "var(--ab-faint)",
        }}>
          Payments processed securely by Stripe · Cancel anytime from account settings
        </p>
      </div>
    </div>
  );
}
