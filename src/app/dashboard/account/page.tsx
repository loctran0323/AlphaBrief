import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { updatePassword } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]);
  const error = get("error");
  const passwordChanged = get("passwordChanged") === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-2xl pb-16">
      <header className="border-b border-[var(--border)] pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          Account settings
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Signed in as{" "}
          <span className="font-medium text-[var(--foreground)]">{user?.email ?? "—"}</span>
        </p>
      </header>

      {error && (
        <div className="mt-6 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {passwordChanged && (
        <div className="mt-6 rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Password updated successfully.
        </div>
      )}

      <section className="mt-10">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Change password</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Enter your current password to confirm, then choose a new one.
          </p>
          <form action={updatePassword} className="mt-5 space-y-3">
            <input
              type="password"
              name="current"
              required
              placeholder="Current password"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--faint)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
            <input
              type="password"
              name="password"
              required
              minLength={8}
              placeholder="New password"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--faint)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
            <input
              type="password"
              name="confirm"
              required
              placeholder="Confirm new password"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--faint)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
            >
              Update password
            </button>
          </form>
        </div>
      </section>

      <p className="mt-10">
        <Link href="/dashboard" className="text-sm font-medium text-[var(--accent)] hover:underline">
          ← Back to Dashboard
        </Link>
      </p>
    </div>
  );
}
