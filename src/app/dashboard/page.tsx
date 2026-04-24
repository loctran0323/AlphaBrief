import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { DashboardQueryError } from "@/components/dashboard-query-error";
import { DashboardLedeSection } from "@/components/dashboard-lede-section";
import { DashboardTimelineTabs } from "@/components/dashboard-timeline-tabs";
import { LocalDateHeading } from "@/components/local-date-heading";
import { LedgerMasthead, LedgerByline, LedgerRuleLabel } from "@/components/ledger-ui";
import { NewsBriefing } from "@/components/news-briefing";
import { fetchMergedDashboardEvents } from "@/lib/events";
import { getNewsBriefing } from "@/lib/news";
import { createClient } from "@/lib/supabase/server";
import { formatDateHeading } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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

  let events;
  try {
    events = await fetchMergedDashboardEvents(supabase, tickers);
  } catch (e) {
    const err = e as { message?: string; code?: string };
    return <DashboardQueryError context="Loading timeline" err={err} />;
  }

  const news = await getNewsBriefing({ tickers, limit: 200 });
  const serverFetchedAt = new Date().toISOString();
  const todayHeading = formatDateHeading(new Date());
  const upcomingCount = events.filter(e => new Date(e.event_date) >= new Date()).length;

  return (
    <div style={{ paddingBottom: 64 }}>
      <AutoRefresh everyMs={300000} />

      {/* ── Masthead ── */}
      <LedgerMasthead
        eyebrow={`Daily Briefing · ${todayHeading}`}
        title={<LocalDateHeading fallback={todayHeading} />}
        dek="Markets compiled by AlphaBrief AI — your watchlist, upcoming catalysts, and the wire."
      />

      {/* ── Byline bar ── */}
      <LedgerByline
        left={`Compiled by AlphaBrief AI · ${news.length} headlines · ${upcomingCount} events · confidence moderate`}
        right={
          <Link href="/dashboard/archive" style={{
            fontSize: 11, border: "1px solid var(--ab-border)",
            padding: "4px 10px", color: "var(--ab-muted)", textDecoration: "none",
          }}>
            Archive →
          </Link>
        }
      />

      {/* ── Lede + pull-quote (AI summary in editorial prose format) ── */}
      <DashboardLedeSection />

      {/* ── Calendar ── */}
      <LedgerRuleLabel>The week ahead · Calendar</LedgerRuleLabel>
      <DashboardTimelineTabs
        events={events}
        watchlistItems={items ?? []}
        perPage={3}
        dataFetchedAt={serverFetchedAt}
      />

      {/* ── News briefing ── */}
      <LedgerRuleLabel>From the wire</LedgerRuleLabel>
      <NewsBriefing
        articles={news}
        watchlistTickers={tickers}
        itemsPerPage={6}
        dataFetchedAt={serverFetchedAt}
      />
    </div>
  );
}
