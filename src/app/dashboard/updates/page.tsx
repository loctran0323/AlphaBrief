import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Updates",
};

const UPDATE_GROUPS: { period: string; bullets: string[] }[] = [
  {
    period: "April 2026",
    bullets: [
      "Recently rebranded from Catalyst to Alpha Brief — same product, new name and site URL.",
      "Market map: larger default view, zoom range, clipped labels, short sector/industry names.",
      "Macro timeline: fewer duplicate events, Eastern-time dates, tier-1 releases only.",
      "News tags: better bullish / bearish / neutral classification.",
      "Archive news: only items older than three days so it doesn't overlap the live briefing.",
      'Dashboard dates and "Updated" times use US Eastern (ET).',
      "Splash page: six feature cards with clearer copy.",
    ],
  },
  {
    period: "Earlier",
    bullets: [
      "Watchlist, dashboard timeline, RSS news briefing (optional AI summaries), sector → industry market map.",
      "Guest Explore view, email digest settings when Resend is configured.",
    ],
  },
];

export default function DashboardUpdatesPage() {
  return (
    <div className="mx-auto max-w-2xl pb-16">
      {/* ── Page header ── */}
      <header className="border-b border-[var(--border)] pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Alpha Brief</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          Updates
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Questions or feedback? Email{" "}
          <a
            href="mailto:locmarkets@gmail.com"
            className="font-medium text-[var(--accent)] hover:underline"
          >
            locmarkets@gmail.com
          </a>
          .
        </p>
      </header>

      {/* ── Update groups ── */}
      <div className="mt-8 space-y-6">
        {UPDATE_GROUPS.map((g) => (
          <div
            key={g.period}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-[var(--surface-highlight)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                {g.period}
              </span>
            </div>
            <ul className="space-y-3">
              {g.bullets.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-[var(--muted)]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Link
          href="/home"
          className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]/50"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
