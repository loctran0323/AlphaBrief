import Link from "next/link";
import { HomeMoverList } from "@/components/home-mover-list";
import { HomeTickerMonitor } from "@/components/home-ticker-monitor";
import { isSupabaseConfigured } from "@/lib/env";
import { fetchMarketHomeData } from "@/lib/market-home-data";
import { fetchYahooChartSnapshot } from "@/lib/market-map-data";
import { createClient } from "@/lib/supabase/server";
import type { WatchlistItem } from "@/types/database";

export const dynamic = "force-dynamic";

const moneyWide = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const money = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function formatPrice(value: number | null, symbol: string): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (symbol.startsWith("^") && value >= 1000) return moneyWide.format(value);
  return money.format(value);
}

function pctClass(pct: number): string {
  if (pct > 0.005) return "text-emerald-600";
  if (pct < -0.005) return "text-red-600";
  return "text-[var(--muted)]";
}

export default async function HomePage() {
  const data = await fetchMarketHomeData();

  let isAuthenticated = false;
  let watchlistId: string | null = null;
  let savedItems: WatchlistItem[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      isAuthenticated = true;
      const { data: watchlists } = await supabase
        .from("watchlists").select("id")
        .order("created_at", { ascending: true }).limit(1);
      watchlistId = watchlists?.[0]?.id ?? null;
      if (watchlistId) {
        const { data: items } = await supabase
          .from("watchlist_items").select("*")
          .eq("watchlist_id", watchlistId)
          .order("created_at", { ascending: true });
        savedItems = items ?? [];
      }
    }
  }

  const savedQuotes = await Promise.all(
    savedItems.map(async (item) => {
      const sym = item.ticker.trim().toUpperCase();
      const snap = await fetchYahooChartSnapshot(sym);
      return { symbol: sym, shortName: snap?.shortName ?? sym, price: snap?.price ?? null, changePct: snap?.changePct ?? 0 };
    }),
  );

  const mapHref = isAuthenticated ? "/dashboard/map" : "/explore/map";

  return (
    <div>
      {/* ── Page header ── */}
      <header className="border-b border-[var(--border)] pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Home</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          Market snapshot
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          ETFs, top movers, and your watchlist — all in one view. Catalysts and news live on the dashboard.
        </p>
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

      {/* ── ETFs & indices ── */}
      <section className="pt-8">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-[var(--foreground)]">ETFs &amp; indices</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Key benchmarks — prices and day change.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.benchmarks.map((b) => (
            <div
              key={b.symbol}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <p className="truncate text-xs text-[var(--muted)]">{b.label}</p>
              <p className="mt-1 font-mono text-[11px] font-semibold text-[var(--accent)]">{b.symbol}</p>
              <p className="mt-2 text-xl font-black tabular-nums text-[var(--foreground)]">
                {formatPrice(b.price, b.symbol)}
              </p>
              <p className={`mt-0.5 text-sm font-semibold tabular-nums ${pctClass(b.changePct)}`}>
                {b.changePct >= 0 ? "+" : ""}
                {b.changePct.toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Movers + Watchlist ── */}
      <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-8">
          {/* Gainers & Losers */}
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Top movers</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Largest % up and down in today&apos;s session.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <HomeMoverList
                title="Top gainers"
                subtitle="Largest % up in the session."
                rows={data.gainers}
                emptyHint="No gainers loaded — market may be closed."
              />
              <HomeMoverList
                title="Top losers"
                subtitle="Largest % down in the session."
                rows={data.losers}
                emptyHint="No losers loaded — market may be closed."
              />
            </div>
          </section>

          {/* Volume & Market cap */}
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Volume &amp; size</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Most-traded by volume and mega-cap leaders.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <HomeMoverList
                title="Most active"
                subtitle="By share volume."
                rows={data.mostActives}
                emptyHint="Could not load most-active list."
              />
              <HomeMoverList
                title="Largest market cap"
                subtitle="Mega-cap leaders."
                rows={data.largestByCap}
                emptyHint="Could not load market-cap list."
              />
            </div>
          </section>
        </div>

        {/* Watchlist sidebar */}
        <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-72 xl:w-80">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-[var(--foreground)]">Your watchlist</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Tickers synced with dashboard &amp; news.</p>
          </div>
          <HomeTickerMonitor
            layout="sidebar"
            isAuthenticated={isAuthenticated}
            watchlistId={watchlistId}
            savedItems={savedItems}
            savedQuotes={savedQuotes}
          />
        </aside>
      </div>
    </div>
  );
}
