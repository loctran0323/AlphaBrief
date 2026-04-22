import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";
import { UpgradeButton } from "./upgrade-button";

export const metadata: Metadata = {
  title: "Upgrade to Pro — AlphaBrief",
};

type Row = { label: string; sub?: string; free: string | boolean; pro: string | boolean };

const planRows: Row[] = [
  { label: "Home market view", free: true, pro: true },
  { label: "Dashboard & news briefing", free: true, pro: true },
  {
    label: "Market map lookups",
    sub: "AI-powered stock analysis on click",
    free: "3 / day",
    pro: "Unlimited",
  },
  {
    label: "Research — news per ticker",
    sub: "AI-tagged headlines on any stock",
    free: "3 articles",
    pro: "Full feed",
  },
  {
    label: "Price alerts",
    sub: "Email when a stock hits your target",
    free: false,
    pro: true,
  },
  {
    label: "Email digest",
    sub: "Daily briefing delivered to your inbox",
    free: false,
    pro: true,
  },
  {
    label: "Archive",
    sub: "Past timeline events & historical news",
    free: false,
    pro: true,
  },
  {
    label: "Community chat",
    sub: "Live chat with other AlphaBrief users",
    free: true,
    pro: true,
  },
  {
    label: "Pro badge in community",
    free: false,
    pro: true,
  },
  {
    label: "Priority new features",
    sub: "First access to everything we ship",
    free: false,
    pro: true,
  },
  {
    label: "Support the mission",
    sub: "Funds better APIs, data & infrastructure",
    free: false,
    pro: true,
  },
];

function Check({ accent = false }: { accent?: boolean }) {
  return (
    <svg
      className={`mx-auto h-5 w-5 ${accent ? "text-[var(--accent)]" : "text-emerald-500"}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function Dash() {
  return <span className="mx-auto block text-center text-[var(--faint)]">—</span>;
}

function Cell({ value, accent = false }: { value: string | boolean; accent?: boolean }) {
  if (value === true) return <Check accent={accent} />;
  if (value === false) return <Dash />;
  return (
    <span className={`block text-center text-sm font-semibold ${accent ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
      {value}
    </span>
  );
}

export default async function UpgradePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const tier = user ? await getUserTier(supabase, user.id, user.email) : "free";

  if (tier === "pro") {
    return (
      <div className="mx-auto max-w-lg pb-16 text-center">
        <div className="mt-10 rounded-xl border border-emerald-200 bg-emerald-50 px-8 py-10">
          <p className="text-2xl font-black text-emerald-800">You&apos;re on Pro</p>
          <p className="mt-2 text-sm text-emerald-700">
            You have full access to all Pro features. Thank you for supporting AlphaBrief!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-16">
      {/* Header */}
      <header className="border-b border-[var(--border)] pb-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--surface-highlight)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
          Beta pricing — lock in forever
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          Compare plans
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--muted)]">
          Every Pro subscription directly funds better data APIs, faster infrastructure, and new features. You&apos;re not just upgrading, you&apos;re helping build something better.
        </p>
      </header>

      {/* Comparison table */}
      <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--border)]">
        <table className="w-full border-collapse text-sm">
          {/* Plan headers */}
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="w-1/2 bg-[var(--card)] px-6 py-5 text-left text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                Feature
              </th>
              <th className="w-1/4 bg-[var(--card)] px-4 py-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Free</p>
                <p className="mt-1 text-2xl font-black text-[var(--foreground)]">$0</p>
                <p className="text-xs text-[var(--faint)]">/month</p>
              </th>
              <th className="w-1/4 bg-[var(--accent)]/5 px-4 py-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Pro</p>
                <p className="mt-1 text-2xl font-black text-[var(--foreground)]">$9</p>
                <p className="text-xs text-[var(--faint)]">/month</p>
              </th>
            </tr>
          </thead>

          {/* Rows */}
          <tbody>
            {planRows.map((row, i) => (
              <tr
                key={row.label}
                className={`border-b border-[var(--border)] last:border-0 ${i % 2 === 0 ? "bg-[var(--card)]" : "bg-[var(--surface)]"}`}
              >
                <td className="px-6 py-4">
                  <p className="font-medium text-[var(--foreground)]">{row.label}</p>
                  {row.sub && <p className="mt-0.5 text-xs text-[var(--faint)]">{row.sub}</p>}
                </td>
                <td className="px-4 py-4">
                  <Cell value={row.free} />
                </td>
                <td className="bg-[var(--accent)]/5 px-4 py-4">
                  <Cell value={row.pro} accent />
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      <div className="mt-8 flex justify-center">
        <UpgradeButton />
      </div>
      <p className="mt-4 text-center text-xs text-[var(--muted)]">
        Payments processed securely by Stripe · Cancel anytime from account settings
      </p>
    </div>
  );
}
