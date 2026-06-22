import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { DashboardQueryError } from "@/components/dashboard-query-error";
import { DashboardLedeSection } from "@/components/dashboard-lede-section";
import { DashboardTimelineTabs } from "@/components/dashboard-timeline-tabs";
import { LocalDateHeading, LocalDateEyebrow } from "@/components/local-date-heading";
import { LedgerMasthead, LedgerByline, LedgerRuleLabel } from "@/components/ledger-ui";
import { NewsBriefing } from "@/components/news-briefing";
import { fetchMergedDashboardEvents } from "@/lib/events";
import { getNewsBriefing } from "@/lib/news";
import { createClient } from "@/lib/supabase/server";
import { formatDateHeading } from "@/lib/date-utils";
import type { WatchlistItem } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  // The briefing is public to browse. Signed-in visitors get their saved
  // watchlist threaded through the timeline and news; guests see the general
  // market briefing with a prompt to log in and build a watchlist.
  const { data: { user } } = await supabase.auth.getUser();

  let items: WatchlistItem[] = [];
  if (user) {
    const { data: watchlists, error: wErr } = await supabase
      .from("watchlists").select("id, name")
      .order("created_at", { ascending: true }).limit(1);

    if (wErr) return <DashboardQueryError context="Loading watchlists" err={wErr} />;

    const watchlist = watchlists?.[0];
    if (watchlist) {
      const { data: wItems, error: iErr } = await supabase
        .from("watchlist_items").select("*")
        .eq("watchlist_id", watchlist.id)
        .order("created_at", { ascending: true });

      if (iErr) return <DashboardQueryError context="Loading watchlist tickers" err={iErr} />;
      items = (wItems ?? []) as WatchlistItem[];
    }
  }

  const tickers = items.map((i) => i.ticker);

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
        eyebrow={<LocalDateEyebrow prefix="Daily Briefing · " fallback={todayHeading} />}
        title={<LocalDateHeading fallback={todayHeading} />}
        dek="Markets compiled by AlphaBrief AI. Your watchlist, upcoming catalysts, and the wire."
      />

      {/* ── Byline bar ── */}
      <LedgerByline
        left={`Compiled by AlphaBrief AI · ${news.length} headlines · ${upcomingCount} events · confidence moderate`}
        leftMobile={`${news.length} headlines · ${upcomingCount} events`}
        right={
          <Link href="/dashboard/archive" style={{
            fontSize: 11, border: "1px solid var(--ab-border)",
            padding: "4px 10px", color: "var(--ab-muted)", textDecoration: "none",
          }}>
            Archive →
          </Link>
        }
      />

      {!user && (
        <p style={{
          fontFamily: "'Source Serif Pro', Georgia, serif", fontStyle: "italic",
          fontSize: 15, color: "var(--ab-muted)",
          border: "1px solid var(--ab-border)", padding: "12px 16px", margin: "0 0 20px",
        }}>
          You&apos;re viewing the general briefing.{" "}
          <Link href="/login?next=/dashboard" style={{ color: "#6C5CE7", fontStyle: "normal" }}>Log in</Link>{" "}
          to track a watchlist and tailor the timeline and headlines to your tickers.
        </p>
      )}

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
