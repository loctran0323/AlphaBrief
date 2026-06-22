import Link from "next/link";
import { ArchiveDateToolbar } from "@/components/archive-date-toolbar";
import { AutoRefresh } from "@/components/auto-refresh";
import { DashboardQueryError } from "@/components/dashboard-query-error";
import { DashboardTimelineTabs } from "@/components/dashboard-timeline-tabs";
import { LedgerMasthead, LedgerByline, LedgerRuleLabel } from "@/components/ledger-ui";
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
import { WeeklyMarketSummarySection } from "@/components/weekly-market-summary-section";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardArchivePage({ searchParams }: Props) {
  const sp = await searchParams;
  const bounds = parseArchiveSearchParams(sp);
  const supabase = await createClient();

  const { data: watchlists, error: wErr } = await supabase
    .from("watchlists").select("id, name")
    .order("created_at", { ascending: true }).limit(1);

  if (wErr) return <DashboardQueryError context="Loading watchlists" err={wErr} />;

  const watchlist = watchlists?.[0];
  if (!watchlist) {
    return (
      <p style={{ color: "var(--ab-muted)" }}>
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
    <div style={{ paddingBottom: 64 }}>
      <AutoRefresh everyMs={300000} />

      {/* ── Masthead ── */}
      <LedgerMasthead
        eyebrow="The Archive · back issues"
        title="Past data"
        dek="Adjust the date ranges below to scope past events and archived headlines."
      />

      {/* ── Byline bar ── */}
      <LedgerByline
        left={`Compiled by AlphaBrief AI · ${pastEvents.length} past events · ${archivedNews.length} archived headlines`}
        leftMobile={`${pastEvents.length} past events · ${archivedNews.length} archived headlines`}
        right={
          <Link href="/dashboard" style={{
            fontSize: 11, border: "1px solid var(--ab-border)",
            padding: "4px 10px", color: "var(--ab-muted)", textDecoration: "none",
          }}>
            ← Back to briefing
          </Link>
        }
      />

      {/* ── Date ranges ── */}
      <LedgerRuleLabel>Date ranges</LedgerRuleLabel>
      <ArchiveDateToolbar
        key={`${bounds.eventsFromMs}-${bounds.eventsToMs}-${bounds.newsFromMs}-${bounds.newsToMs}`}
        eventsFromYmd={toYmdUtc(bounds.eventsFromMs)}
        eventsToYmd={toYmdUtc(bounds.eventsToMs)}
        newsFromYmd={toYmdUtc(bounds.newsFromMs)}
        newsToYmd={toYmdUtc(bounds.newsToMs)}
      />

      {/* ── Weekly AI Recap ── */}
      <LedgerRuleLabel right="updated periodically">Weekly market recap</LedgerRuleLabel>
      <WeeklyMarketSummarySection />

      {/* ── Past timeline ── */}
      <LedgerRuleLabel>Past timeline</LedgerRuleLabel>
      <DashboardTimelineTabs
        events={pastEvents}
        watchlistItems={items ?? []}
        perPage={2}
        pastArchiveMode
        sectionTitle="Past timeline"
        readMoreUrlsByEventId={readMoreUrlsByEventId}
      />

      {/* ── Archived news ── */}
      <LedgerRuleLabel>Archived news</LedgerRuleLabel>
      <NewsBriefing
        title="Archived news"
        articles={archivedNews}
        itemsPerPage={4}
        emptyHintTickers="No watchlist-tagged headlines in this range. Try All, widen dates, or check back later."
      />
    </div>
  );
}
