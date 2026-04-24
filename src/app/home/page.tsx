import Link from "next/link";
import { ChatRoom } from "@/components/chat-room";
import { WatchlistRowLedger } from "@/components/watchlist-row";
import { BenchmarkCard, MoverColClient } from "@/components/home-hover-links";
import { AddTickerForm } from "@/components/add-ticker-form";
import { LedgerMasthead, LedgerRuleLabel } from "@/components/ledger-ui";
import { isSupabaseConfigured } from "@/lib/env";
import { fetchMarketHomeData } from "@/lib/market-home-data";
import { fetchYahooChartSnapshot } from "@/lib/market-map-data";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";
import type { WatchlistItem } from "@/types/database";
import type { MarketMover } from "@/lib/market-home-data";

export const dynamic = "force-dynamic";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

const moneyWide = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money     = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const compact   = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });

function formatPrice(value: number | null, symbol: string): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (symbol.startsWith("^") && value >= 1000) return moneyWide.format(value);
  return money.format(value);
}

function pctColor(pct: number): string {
  if (pct > 0.005) return "var(--ab-up)";
  if (pct < -0.005) return "var(--ab-down)";
  return "var(--ab-faint)";
}

function signedPct(pct: number): string {
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
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
      return { symbol: sym, shortName: snap?.shortName ?? sym, price: snap?.price ?? null, changePct: snap?.changePct ?? 0 };
    }),
  );

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  const eyebrow = `Market Snapshot · ${dateStr}`;

  // Pick the biggest daily mover for the editorial lede
  const topGainer = data.gainers[0];
  const ledeTitle = topGainer
    ? `${topGainer.symbol} leads ${topGainer.changePct.toFixed(2) > "10" ? "a sharp" : "a"} advance with ${signedPct(topGainer.changePct)}`
    : "A mixed session across the major indices";
  const ledeDek = topGainer
    ? `${topGainer.name || topGainer.symbol} is the session's standout gainer. Check the full research page for catalysts and news coverage.`
    : "Indices are trading in a narrow band as investors digest the latest economic data.";

  return (
    <div style={{ paddingBottom: 64, fontFamily: SANS_L, color: "var(--ab-fg)" }}>

      {/* ── Masthead ── */}
      <LedgerMasthead
        eyebrow={eyebrow}
        title="A quiet tape steadies the week"
        dek="Indices, ETFs, top movers, and your watchlist — the full picture in one view."
      />

      {/* ── Benchmarks — flat 4-column quote strip ── */}
      <LedgerRuleLabel>Benchmarks</LedgerRuleLabel>
      <div className="grid ab-grid-4" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "18px 32px" }}>
        {data.benchmarks.map((b) => (
          <BenchmarkCard
            key={b.symbol}
            symbol={b.symbol}
            label={b.label}
            price={b.price}
            changePct={b.changePct}
            isIndex={b.symbol.startsWith("^")}
          />
        ))}
      </div>

      {/* ── Watchlist ── */}
      {isAuthenticated && watchlistId && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <LedgerRuleLabel>Your watchlist</LedgerRuleLabel>
            <AddTickerForm watchlistId={watchlistId} size="sm" placeholder="Add ticker…" />
          </div>
          <WatchlistRowLedger
            watchlistId={watchlistId}
            savedItems={savedItems}
            savedQuotes={savedQuotes}
          />
        </>
      )}

      {/* ── Movers of the day — 3-column editorial ── */}
      <LedgerRuleLabel>Movers of the day</LedgerRuleLabel>
      <div className="grid ab-movers-grid" style={{ gridTemplateColumns: "1.2fr 1fr 1fr", gap: 32 }}>
        {/* Editorial lede */}
        <div>
          <div style={{ fontFamily: SERIF_L, fontSize: 14, fontStyle: "italic", color: "var(--ab-muted)", marginBottom: 6 }}>
            The leaders
          </div>
          <h3 style={{ fontFamily: SERIF_L, fontSize: 24, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-.01em", marginBottom: 14, color: "var(--ab-fg)" }}>
            {ledeTitle}
          </h3>
          <p style={{ fontFamily: SERIF_L, fontSize: 15, lineHeight: 1.55, color: "var(--ab-muted)", margin: 0 }}>
            {ledeDek}
          </p>
          {topGainer && (
            <Link href={`/dashboard/research/${topGainer.symbol}`} style={{ fontSize: 12, color: ACCENT, marginTop: 10, display: "inline-block", letterSpacing: ".04em", textDecoration: "none" }}>
              Read full report →
            </Link>
          )}
        </div>
        <MoverColClient label="Gainers" rows={data.gainers.slice(0, 6)} />
        <MoverColClient label="Losers"  rows={data.losers.slice(0, 6)} />
      </div>

      {/* ── Most active + Largest cap ── */}
      <div className="grid ab-movers-2col" style={{ gridTemplateColumns: "1fr 1fr", gap: 32, marginTop: 28 }}>
        <MoverColClient label="Most active" rows={data.mostActives.slice(0, 6)} />
        <MoverColClient label="Largest cap" rows={data.largestByCap.slice(0, 6)} />
      </div>

      {/* End-of-section rule */}
      <div style={{ marginTop: 48, textAlign: "center" as const, fontFamily: SERIF_L, fontStyle: "italic", color: "var(--ab-faint)", fontSize: 12 }}>
        — end of section —
      </div>

      {/* ── Community chat — floating sidebar ── */}
      <ChatRoom email={userEmail} isPro={userIsPro} />
    </div>
  );
}
