import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { DashboardQueryError } from "@/components/dashboard-query-error";
import { DashboardTimelineTabs } from "@/components/dashboard-timeline-tabs";
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

  const news = await getNewsBriefing({ tickers, limit: 72 });
  const serverFetchedAt = new Date().toISOString();
  const todayHeading = formatDateHeading(new Date());

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <AutoRefresh everyMs={300000} />

      {/* ── Page header ── */}
      <header className="border-b border-[var(--border)] pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          {todayHeading}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Watchlist, upcoming catalysts, and news briefing.{" "}
          <Link href="/dashboard/archive" className="font-medium text-[var(--accent)] hover:underline">
            Archive →
          </Link>
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
            <p className="text-2xl font-black tabular-nums text-[var(--foreground)]">{items?.length ?? 0}</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">watchlist tickers</p>
          </div>
        </div>
      </header>

      {/* ── Watchlist ── */}
      <section className="border-b border-[var(--border)] py-8">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Watchlist</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Symbols drive ticker-specific timeline rows and headline matching.
          </p>
        </div>
        <WatchlistPanel watchlistId={watchlist.id} items={items ?? []} />
      </section>

      {/* ── Timeline & News ── */}
      <section className="space-y-5 pt-8">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-7">
          <DashboardTimelineTabs
            events={events}
            watchlistItems={items ?? []}
            perPage={3}
            dataFetchedAt={serverFetchedAt}
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-7">
          <NewsBriefing articles={news} watchlistTickers={tickers} itemsPerPage={4} dataFetchedAt={serverFetchedAt} />
        </div>
      </section>
    </div>
  );
}
