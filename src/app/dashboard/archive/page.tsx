import Link from "next/link";
import { ArchiveDateToolbar } from "@/components/archive-date-toolbar";
import { AutoRefresh } from "@/components/auto-refresh";
import { DashboardQueryError } from "@/components/dashboard-query-error";
import { DashboardTimelineTabs } from "@/components/dashboard-timeline-tabs";
import { NewsBriefing } from "@/components/news-briefing";
import {
  filterEventsByEventDateRange,
  parseArchiveSearchParams,
  toYmdUtc,
} from "@/lib/archive-range";
import { fetchMergedPastDashboardEvents } from "@/lib/events";
import { fetchReadMoreUrlsWithConcurrency } from "@/lib/release-web-context";
import { getArchivedNewsBriefing } from "@/lib/news";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardArchivePage({ searchParams }: Props) {
  const sp = await searchParams;
  const bounds = parseArchiveSearchParams(sp);
  const supabase = await createClient();

  // Pro-only gate
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const tier = await getUserTier(supabase, user.id, user.email);
    if (tier !== "pro") {
      return (
        <div className="mx-auto max-w-2xl pb-16">
          <header className="border-b border-[var(--border)] pb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Archive</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">Pro feature</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Access to the full archive is available on the Pro plan.
            </p>
          </header>
          <div className="mt-10 rounded-xl border-2 border-[var(--accent)] bg-[var(--surface-highlight)] p-8 text-center">
            <p className="text-2xl font-black text-[var(--foreground)]">Upgrade to Pro</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Unlock the full archive, unlimited market map lookups, and priority access to new features.
            </p>
            <Link
              href="/dashboard/upgrade"
              className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-8 py-3 font-semibold text-white transition hover:bg-[var(--accent-muted)]"
            >
              See Pro plan
            </Link>
          </div>
        </div>
      );
    }
  }

  const { data: watchlists, error: wErr } = await supabase
    .from("watchlists").select("id, name")
    .order("created_at", { ascending: true }).limit(1);

  if (wErr) return <DashboardQueryError context="Loading watchlists" err={wErr} />;

  const watchlist = watchlists?.[0];
  if (!watchlist) {
    return (
      <p className="text-[var(--muted)]">
        No watchlist found. Try signing out and back in, or run the database migration.
      </p>
    );
  }

  const { data: items, error: iErr } = await supabase
    .from("watchlist_items").select("*")
    .eq("watchlist_id", watchlist.id)
    .order("created_at", { ascending: true });

  if (iErr) return <DashboardQueryError context="Loading watchlist tickers" err={iErr} />;

  const tickers = (items ?? []).map((i) => i.ticker);

  let pastEventsAll;
  try {
    pastEventsAll = await fetchMergedPastDashboardEvents(supabase, tickers);
  } catch (e) {
    const err = e as { message?: string; code?: string };
    return <DashboardQueryError context="Loading past timeline" err={err} />;
  }

  const pastEvents = filterEventsByEventDateRange(pastEventsAll, bounds.eventsFromMs, bounds.eventsToMs);
  const readMoreUrlsByEventId = await fetchReadMoreUrlsWithConcurrency(pastEvents, 4);
  const archivedNews = await getArchivedNewsBriefing({
    tickers,
    limit: 200,
    publishedFromMs: bounds.newsFromMs,
    publishedToMs: bounds.newsToMs,
  });

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <AutoRefresh everyMs={300000} />

      {/* ── Page header ── */}
      <header className="border-b border-[var(--border)] pb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Archive</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
              Past data
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Past events and headlines — pick a date range below (3–30 days back).
            </p>
          </div>
          <Link
            href="/dashboard"
            className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]/50"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Stat chips */}
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3">
            <p className="text-2xl font-black tabular-nums text-[var(--foreground)]">{pastEvents.length}</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">past events</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3">
            <p className="text-2xl font-black tabular-nums text-[var(--foreground)]">{archivedNews.length}</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">archived headlines</p>
          </div>
        </div>
      </header>

      {/* ── Date range toolbar ── */}
      <section className="border-b border-[var(--border)] py-8">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Date range</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Narrow events and news independently, then apply.</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <ArchiveDateToolbar
            key={`${bounds.eventsFromMs}-${bounds.eventsToMs}-${bounds.newsFromMs}-${bounds.newsToMs}`}
            eventsFromYmd={toYmdUtc(bounds.eventsFromMs)}
            eventsToYmd={toYmdUtc(bounds.eventsToMs)}
            newsFromYmd={toYmdUtc(bounds.newsFromMs)}
            newsToYmd={toYmdUtc(bounds.newsToMs)}
          />
        </div>
      </section>

      {/* ── Timeline & News ── */}
      <section className="space-y-5 pt-8">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-7">
          <DashboardTimelineTabs
            events={pastEvents}
            watchlistItems={items ?? []}
            perPage={2}
            pastArchiveMode
            sectionTitle="Past timeline"
            readMoreUrlsByEventId={readMoreUrlsByEventId}
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-7">
          <NewsBriefing
            title="Archived news"
            articles={archivedNews}
            itemsPerPage={4}
            emptyHintTickers="No watchlist-tagged headlines in this range. Try All, widen dates, or check back later."
          />
        </div>
      </section>
    </div>
  );
}
