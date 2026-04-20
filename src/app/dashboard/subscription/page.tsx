import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";
import { ManageBillingButton } from "./manage-billing-button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Subscription — AlphaBrief",
};

function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const tier = user ? await getUserTier(supabase, user.id, user.email) : "free";
  const isPro = tier === "pro";
  const isAdmin = isAdminEmail(user?.email);

  return (
    <div className="mx-auto max-w-xl pb-16">
      <header className="border-b border-[var(--border)] pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Subscription
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Manage your plan and billing details.
        </p>
      </header>

      <div className="mt-10 space-y-4">
        {/* Current plan card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                Current plan
              </p>
              <p className="mt-1 text-2xl font-black text-[var(--foreground)]">
                {isPro ? "Pro" : "Free"}
              </p>
              {isPro ? (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Full access — unlimited map lookups, archive, and priority features.
                </p>
              ) : (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  3 market map lookups per day. Upgrade for full access.
                </p>
              )}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isPro
                  ? "bg-[var(--surface-highlight)] text-[var(--accent)]"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {isPro ? "Pro" : "Free"}
            </span>
          </div>
        </div>

        {isPro ? (
          <>
            {!isAdmin && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
                <p className="text-sm font-medium text-[var(--foreground)]">Billing & cancellation</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Update your payment method, download invoices, or cancel your subscription from the
                  Stripe billing portal.
                </p>
                <ManageBillingButton />
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border-2 border-[var(--accent)] bg-[var(--surface-highlight)] p-6">
            <p className="font-semibold text-[var(--foreground)]">Upgrade to Pro — $9/month</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Unlock the full archive, unlimited market map lookups, and priority access to new
              features. Beta price locked in for early supporters.
            </p>
            <Link
              href="/dashboard/upgrade"
              className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-muted)]"
            >
              See Pro plan
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
