import Link from "next/link";
import { ChatRoom } from "@/components/chat-room";
import { HomeMoverList } from "@/components/home-mover-list";
import { WatchlistRow } from "@/components/watchlist-row";
import { addTicker } from "@/app/dashboard/actions";
import { isSupabaseConfigured } from "@/lib/env";
import { fetchMarketHomeData } from "@/lib/market-home-data";
import { fetchYahooChartSnapshot } from "@/lib/market-map-data";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";
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
  let userEmail: string | null = null;
  let userIsPro = false;
  let watchlistId: string | null = null;
  let savedItems: WatchlistItem[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      isAuthenticated = true;
      userEmail = user.email ?? null;
      const tier = await getUserTier(supabase, user.id, user.email);
      userIsPro = tier === "pro";
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
      return {
        symbol: sym,
        shortName: snap?.shortName ?? sym,
        price: snap?.price ?? null,
        changePct: snap?.changePct ?? 0,
      };
    }),
  );

  const mapHref = isAuthenticated ? "/dashboard/map" : "/explore/map";

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Market snapshot</h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">ETFs, top movers, and your watchlist in one view.</p>
        </div>
        <nav className="flex items-center gap-4 text-sm text-[var(--muted)]">
          <Link href="/dashboard" className="transition-colors hover:text-[var(--foreground)]">Dashboard</Link>
          <span className="text-[var(--faint)]">/</span>
          <Link href={mapHref} className="transition-colors hover:text-[var(--foreground)]">Map</Link>
          <span className="text-[var(--faint)]">/</span>
          <Link href="/dashboard/research" className="transition-colors hover:text-[var(--foreground)]">Research</Link>
        </nav>
      </div>

      {/* ── ETFs & indices ── */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">ETFs &amp; indices</p>
        <div
          className="grid grid-cols-2 overflow-hidden rounded-xl sm:grid-cols-4"
          style={{ border: "1px solid var(--border)" }}
        >
          {data.benchmarks.map((b, i) => (
            <div
              key={b.symbol}
              className="bg-[var(--card)] p-4"
              style={{
                borderRight: i % 4 !== 3 ? "1px solid var(--border)" : undefined,
                borderBottom: i < 4 ? "1px solid var(--border)" : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-1">
                <p className="truncate text-xs text-[var(--muted)]">{b.label}</p>
                <p className={`shrink-0 text-xs font-semibold tabular-nums ${pctClass(b.changePct)}`}>
                  {b.changePct >= 0 ? "+" : ""}{b.changePct.toFixed(2)}%
                </p>
              </div>
              <p className="mt-2 text-lg font-bold tabular-nums text-[var(--foreground)]">
                {formatPrice(b.price, b.symbol)}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-[var(--faint)]">{b.symbol}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Watchlist horizontal row ── */}
      {isAuthenticated && watchlistId && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Your watchlist</p>
            <form action={addTicker} className="flex items-center gap-2">
              <input type="hidden" name="watchlist_id" value={watchlistId} />
              <input
                name="ticker"
                placeholder="Add ticker…"
                maxLength={16}
                autoComplete="off"
                className="w-28 rounded-lg border bg-[var(--surface)] px-2.5 py-1 font-mono text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20"
                style={{ borderColor: "var(--border)" }}
              />
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90"
              >
                Add
              </button>
            </form>
          </div>
          <WatchlistRow
            watchlistId={watchlistId}
            savedItems={savedItems}
            savedQuotes={savedQuotes}
            showAddForm={false}
          />
        </section>
      )}

      {/* ── All four mover lists in one unified grid ── */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Movers &amp; volume</p>
        <div
          className="grid grid-cols-1 gap-px overflow-hidden rounded-xl sm:grid-cols-2"
          style={{ background: "var(--border)", border: "1px solid var(--border)" }}
        >
          <div className="bg-[var(--card)] p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Gainers</p>
            <HomeMoverList title="Gainers" rows={data.gainers} emptyHint="No gainers — market may be closed." bare />
          </div>
          <div className="bg-[var(--card)] p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Losers</p>
            <HomeMoverList title="Losers" rows={data.losers} emptyHint="No losers — market may be closed." bare />
          </div>
          <div className="bg-[var(--card)] p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Most active</p>
            <HomeMoverList title="Most active" rows={data.mostActives} emptyHint="Could not load most-active list." bare />
          </div>
          <div className="bg-[var(--card)] p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Largest cap</p>
            <HomeMoverList title="Largest cap" rows={data.largestByCap} emptyHint="Could not load market-cap list." bare />
          </div>
        </div>
      </section>

      {/* ── Community chat — full-width row ── */}
      <section>
        <ChatRoom email={userEmail} isPro={userIsPro} />
      </section>
    </div>
  );
}
