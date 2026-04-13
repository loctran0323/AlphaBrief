import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { DashboardTimelineTabs } from "@/components/dashboard-timeline-tabs";
import { NewsBriefing } from "@/components/news-briefing";
import { getGuestTimelineEvents } from "@/lib/events";
import { getNewsBriefing } from "@/lib/news";
import { formatEtTimeShort } from "@/lib/date-utils";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { WatchlistItem } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  let isAuthenticated = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);
  }
  const mapHref = isAuthenticated ? "/dashboard/map" : "/explore/map";

  const events = getGuestTimelineEvents();
  const news = await getNewsBriefing({ tickers: [], limit: 36 });
  const fetchedAt = new Date().toISOString();
  const watchlistItems: WatchlistItem[] = [];

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <AutoRefresh everyMs={300000} />

      {/* ── Page header ── */}
      <header className="border-b border-[var(--border)] pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Explore</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          Macro timeline &amp; news
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          No account required for this view.{" "}
          <Link href="/signup" className="font-medium text-[var(--accent)] hover:underline">Sign up</Link>{" "}
          for a watchlist and the full dashboard.
        </p>

        {/* Stat chips */}
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3">
            <p className="text-2xl font-black tabular-nums text-[var(--foreground)]">{events.length}</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">timeline events</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3">
            <p className="text-2xl font-black tabular-nums text-[var(--foreground)]">{news.length}</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">headlines</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3">
            <p className="text-2xl font-black tabular-nums text-[var(--foreground)]">
              {formatEtTimeShort(new Date(fetchedAt), { seconds: true })}
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">last fetch · guest</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
          >
            Open dashboard
          </Link>
          <Link
            href={mapHref}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]/50"
          >
            Open map
          </Link>
        </div>
      </header>

      {/* ── Watchlist (guest notice) ── */}
      <section className="border-b border-[var(--border)] py-8">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Watchlist</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Saving tickers requires an account.{" "}
            <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">Log in</Link>{" "}
            or{" "}
            <Link href="/signup" className="font-medium text-[var(--accent)] hover:underline">sign up</Link>{" "}
            to unlock the Tickers tab and matched headlines.
          </p>
        </div>
        <Link
          href="/signup"
          className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/50"
        >
          Create free account →
        </Link>
      </section>

      {/* ── Timeline & News ── */}
      <section className="space-y-5 pt-8">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-7">
          <DashboardTimelineTabs
            events={events}
            watchlistItems={watchlistItems}
            perPage={2}
            guestMode
            dataFetchedAt={fetchedAt}
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-7">
          <NewsBriefing articles={news} itemsPerPage={2} dataFetchedAt={fetchedAt} />
        </div>
      </section>
    </div>
  );
}
