import Link from "next/link";
import type { Metadata } from "next";
import { sendTestDigest, updateDigest } from "@/app/dashboard/actions";
import { createClient } from "@/lib/supabase/server";
import type { DigestFrequency } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
};

type DigestTest = "sent" | "fail" | "noemail";

function parseDigestTest(raw: string | string[] | undefined): DigestTest | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "sent" || v === "fail" || v === "noemail") return v;
  return null;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const digestTest = parseDigestTest(sp.digestTest);
  const failReason =
    typeof sp.reason === "string" ? sp.reason : Array.isArray(sp.reason) ? sp.reason[0] : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let frequency: DigestFrequency = "none";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("digest_frequency")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.digest_frequency) frequency = profile.digest_frequency;
  }

  const options: { value: DigestFrequency; label: string; hint: string }[] = [
    { value: "none", label: "Off", hint: "No scheduled digest emails." },
    { value: "daily", label: "Daily", hint: "When cron is configured, a daily send (server-side)." },
    { value: "weekly", label: "Weekly", hint: "When cron is configured, a weekly send (server-side)." },
  ];

  return (
    <div className="mx-auto max-w-2xl pb-16">
      <header className="border-b border-[var(--border)] pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Settings</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          Email &amp; digest
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Choose how often you want a digest. Test emails use your account address (
          <span className="font-medium text-[var(--foreground)]">{user?.email ?? "—"}</span>
          ).
        </p>
      </header>

      {digestTest === "sent" && (
        <div
          className="mt-6 rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          Test digest sent — check your inbox (and spam).
        </div>
      )}
      {digestTest === "fail" && (
        <div
          className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          <p className="font-medium">Could not send test digest.</p>
          {failReason ? <p className="mt-1 text-red-200/90">{failReason}</p> : null}
        </div>
      )}
      {digestTest === "noemail" && (
        <div
          className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          Your account has no email on file; add one in Supabase Auth or sign in with an email provider.
        </div>
      )}

      <section className="mt-10 space-y-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Digest frequency</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Saved on your profile. Automated batch sends still require a configured cron job on the host.
          </p>
          <form action={updateDigest} className="mt-5 space-y-3">
            {options.map((o) => (
              <label
                key={o.value}
                className="flex cursor-pointer gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]/40"
              >
                <input
                  type="radio"
                  name="digest_frequency"
                  value={o.value}
                  defaultChecked={frequency === o.value}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium text-[var(--foreground)]">{o.label}</span>
                  <span className="mt-0.5 block text-sm text-[var(--muted)]">{o.hint}</span>
                </span>
              </label>
            ))}
            <button
              type="submit"
              className="mt-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
            >
              Save preference
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Test email</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Sends one sample digest now: briefing headlines and upcoming events from your watchlist.
          </p>
          <form action={sendTestDigest} className="mt-5">
            <button
              type="submit"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-highlight)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]/50"
            >
              Send test digest
            </button>
          </form>
        </div>
      </section>

      <p className="mt-10">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </p>
    </div>
  );
}
