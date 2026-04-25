import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TickerSearch } from "./ticker-search";
import { LedgerRuleLabel } from "@/components/ledger-ui";
import { ResearchTickerChips } from "@/components/research-ticker-chips";

export const metadata: Metadata = { title: "Research — AlphaBrief" };
export const dynamic = "force-dynamic";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

const POPULAR = ["MSFT", "GOOGL", "META", "AMZN", "SPY"];

export default async function ResearchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let savedTickers: string[] = [];
  if (user) {
    const { data: watchlists } = await supabase
      .from("watchlists").select("id")
      .order("created_at", { ascending: true }).limit(1);
    const watchlistId = watchlists?.[0]?.id;
    if (watchlistId) {
      const { data: items } = await supabase
        .from("watchlist_items").select("ticker")
        .eq("watchlist_id", watchlistId)
        .order("created_at", { ascending: true });
      savedTickers = (items ?? []).map((i: { ticker: string }) => i.ticker.toUpperCase());
    }
  }

  return (
    <div className="px-0 sm:px-0 pt-10 sm:pt-20" style={{ maxWidth: 920, margin: "0 auto", paddingBottom: 60, textAlign: "center", fontFamily: SANS_L }}>
      {/* Eyebrow */}
      <div style={{ fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: ACCENT, fontWeight: 700, marginBottom: 14 }}>
        Research · The desk
      </div>

      {/* Hero headline */}
      <h1 className="text-4xl sm:text-6xl" style={{ fontFamily: SERIF_L, fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1, margin: "0 0 14px" }}>
        Look up any ticker.
      </h1>
      <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 18, color: "var(--ab-muted)", margin: "0 auto" }}>
        Price, chart, valuation, and AI-summarized headlines.
      </p>

      {/* Underline-only search */}
      <div style={{ maxWidth: 640, margin: "40px auto 0", textAlign: "left" }}>
        <TickerSearch ledger />
      </div>

      {/* Your tickers */}
      {savedTickers.length > 0 && (
        <>
          <LedgerRuleLabel>Your tickers</LedgerRuleLabel>
          <ResearchTickerChips tickers={savedTickers} />
        </>
      )}

      {/* Popular */}
      <LedgerRuleLabel>Popular</LedgerRuleLabel>
      <ResearchTickerChips tickers={POPULAR.filter(t => !savedTickers.includes(t))} />


    </div>
  );
}
