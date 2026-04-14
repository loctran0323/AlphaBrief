import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";
import { UpgradeButton } from "./upgrade-button";

export const metadata: Metadata = {
  title: "Upgrade to Pro — Alpha Brief",
};

const planRows: { label: string; free: string | boolean; pro: string | boolean }[] = [
  { label: "Home market view", free: true, pro: true },
  { label: "Dashboard & news briefing", free: true, pro: true },
  { label: "Market map lookups", free: "3 / day", pro: "Unlimited" },
  { label: "Archive (past timeline)", free: false, pro: true },
  { label: "Priority new features", free: false, pro: true },
  { label: "Support the beta", free: false, pro: true },
];

function Check() {
  return (
    <svg className="h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}
function X() {
  return (
    <svg className="h-4 w-4 shrink-0 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
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
          <p className="text-2xl font-black text-emerald-800">You are on Pro</p>
          <p className="mt-2 text-sm text-emerald-700">
            You already have full access to all Pro features. Thank you for supporting the beta!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <header className="border-b border-[var(--border)] pb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--surface-highlight)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
          Beta pricing
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          Upgrade to Pro
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          We are still in beta — early supporters lock in this price forever.
        </p>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {/* Free */}
        <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Free</p>
          <div className="mt-3 flex items-end gap-1">
            <span className="text-4xl font-black text-[var(--foreground)]">$0</span>
            <span className="mb-1 text-sm text-[var(--muted)]">/month</span>
          </div>
          <ul className="mt-7 space-y-3 flex-1">
            {planRows.map((r) => (
              <li key={r.label} className="flex items-start gap-2.5 text-sm">
                {r.free === false ? <X /> : <Check />}
                <span className={r.free === false ? "text-[var(--faint)]" : "text-[var(--foreground)]"}>
                  {r.label}
                  {typeof r.free === "string" && <span className="ml-1 font-medium">({r.free})</span>}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-7 rounded-lg border border-[var(--border)] px-5 py-3 text-center text-sm text-[var(--muted)]">
            Your current plan
          </div>
        </div>

        {/* Pro */}
        <div className="flex flex-col rounded-2xl border-2 border-[var(--accent)] bg-[var(--card)] p-7 shadow-lg shadow-[var(--accent)]/10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Pro</p>
            <span className="rounded-full bg-[var(--surface-highlight)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
              Beta price
            </span>
          </div>
          <div className="mt-3 flex items-end gap-1">
            <span className="text-4xl font-black text-[var(--foreground)]">$4</span>
            <span className="mb-1 text-sm text-[var(--muted)]">/month</span>
          </div>
          <ul className="mt-7 space-y-3 flex-1">
            {planRows.map((r) => (
              <li key={r.label} className="flex items-start gap-2.5 text-sm">
                <svg className="h-4 w-4 shrink-0 text-[var(--accent)]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-[var(--foreground)]">
                  {r.label}
                  {typeof r.pro === "string" && <span className="ml-1 font-medium">({r.pro})</span>}
                </span>
              </li>
            ))}
          </ul>
          <UpgradeButton />
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-[var(--muted)]">
        Payments are processed securely by Stripe. Cancel anytime from Settings.
      </p>
    </div>
  );
}
