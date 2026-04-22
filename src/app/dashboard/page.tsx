import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { DashboardQueryError } from "@/components/dashboard-query-error";
import { DashboardTimelineTabs } from "@/components/dashboard-timeline-tabs";
import { LocalDateHeading } from "@/components/local-date-heading";
import { NewsBriefing } from "@/components/news-briefing";
import { WatchlistPanel } from "@/components/watchlist-panel";
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

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <AutoRefresh everyMs={300000} />

      {/* ── Header ── */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            <LocalDateHeading fallback={todayHeading} />
          </h1>
          <div className="mt-1.5 flex items-center gap-3 text-sm text-[var(--muted)]">
            <span><span className="font-semibold text-[var(--foreground)]">{events.length}</span> events</span>
            <span className="text-[var(--faint)]">·</span>
            <span><span className="font-semibold text-[var(--foreground)]">{news.length}</span> headlines</span>
            <span className="text-[var(--faint)]">·</span>
            <span><span className="font-semibold text-[var(--foreground)]">{items?.length ?? 0}</span> tickers</span>
          </div>
        </div>
        <Link
          href="/dashboard/archive"
          className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          style={{ border: "1px solid var(--border)" }}
        >
          Archive →
        </Link>
      </div>

      {/* ── Watchlist ── */}
      <div className="mb-8 overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Watchlist</p>
        </div>
        <div className="bg-[var(--card)] px-5 py-4">
          <WatchlistPanel watchlistId={watchlist.id} items={items ?? []} />
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="mb-8 overflow-hidden rounded-xl bg-[var(--card)]" style={{ border: "1px solid var(--border)" }}>
        <div className="px-5 py-5">
          <DashboardTimelineTabs
            events={events}
            watchlistItems={items ?? []}
            perPage={3}
            dataFetchedAt={serverFetchedAt}
          />
        </div>
      </div>

      {/* ── News briefing ── */}
      <div className="overflow-hidden rounded-xl bg-[var(--card)]" style={{ border: "1px solid var(--border)" }}>
        <div className="px-5 py-5">
          <NewsBriefing articles={news} watchlistTickers={tickers} itemsPerPage={4} dataFetchedAt={serverFetchedAt} />
        </div>
      </div>
    </div>
  );
}
