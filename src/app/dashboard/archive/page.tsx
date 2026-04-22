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
import { WeeklyMarketSummarySection } from "@/components/weekly-market-summary-section";

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
          <div className="mb-8 flex items-start justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Archive</h1>
            <Link href="/dashboard" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
              ← Dashboard
            </Link>
          </div>
          <div className="rounded-xl p-8 text-center" style={{ border: "2px solid var(--accent)", background: "var(--surface-highlight)" }}>
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

      {/* ── Header ── */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Past data</h1>
          <div className="mt-1.5 flex items-center gap-3 text-sm text-[var(--muted)]">
            <span><span className="font-semibold text-[var(--foreground)]">{pastEvents.length}</span> past events</span>
            <span className="text-[var(--faint)]">·</span>
            <span><span className="font-semibold text-[var(--foreground)]">{archivedNews.length}</span> archived headlines</span>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          style={{ border: "1px solid var(--border)" }}
        >
          ← Dashboard
        </Link>
      </div>

      {/* ── Date range ── */}
      <div className="mb-8 overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
        <div className="bg-[var(--card)] px-5 py-5">
          <ArchiveDateToolbar
            key={`${bounds.eventsFromMs}-${bounds.eventsToMs}-${bounds.newsFromMs}-${bounds.newsToMs}`}
            eventsFromYmd={toYmdUtc(bounds.eventsFromMs)}
            eventsToYmd={toYmdUtc(bounds.eventsToMs)}
            newsFromYmd={toYmdUtc(bounds.newsFromMs)}
            newsToYmd={toYmdUtc(bounds.newsToMs)}
          />
        </div>
      </div>

      {/* ── Weekly AI Recap ── */}
      <div className="mb-8">
        <WeeklyMarketSummarySection />
      </div>

      {/* ── Past timeline ── */}
      <div className="mb-8 overflow-hidden rounded-xl bg-[var(--card)]" style={{ border: "1px solid var(--border)" }}>
        <div className="px-5 py-5">
          <DashboardTimelineTabs
            events={pastEvents}
            watchlistItems={items ?? []}
            perPage={2}
            pastArchiveMode
            sectionTitle="Past timeline"
            readMoreUrlsByEventId={readMoreUrlsByEventId}
          />
        </div>
      </div>

      {/* ── Archived news ── */}
      <div className="overflow-hidden rounded-xl bg-[var(--card)]" style={{ border: "1px solid var(--border)" }}>
        <div className="px-5 py-5">
          <NewsBriefing
            title="Archived news"
            articles={archivedNews}
            itemsPerPage={4}
            emptyHintTickers="No watchlist-tagged headlines in this range. Try All, widen dates, or check back later."
          />
        </div>
      </div>
    </div>
  );
}
