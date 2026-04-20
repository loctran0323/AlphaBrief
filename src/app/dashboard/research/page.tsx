import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TickerSearch } from "./ticker-search";

export const metadata: Metadata = {
  title: "Research — AlphaBrief",
};

export const dynamic = "force-dynamic";

const POPULAR = ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMZN", "TSLA", "SPY"];

function TickerChip({ ticker }: { ticker: string }) {
  return (
    <a
      href={`/dashboard/research/${ticker}`}
      className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 font-mono text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
    >
      {ticker}
    </a>
  );
}

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
    <div className="mx-auto max-w-2xl py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Research</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
        Stock lookup
      </h1>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Search any ticker for price, chart, key stats, and recent news.
      </p>

      <div className="mt-8">
        <TickerSearch />
      </div>

      {savedTickers.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--faint)]">Your tickers</p>
          <div className="flex flex-wrap justify-center gap-2">
            {savedTickers.map((t) => <TickerChip key={t} ticker={t} />)}
          </div>
        </div>
      )}

      <div className="mt-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--faint)]">Popular</p>
        <div className="flex flex-wrap justify-center gap-2">
          {POPULAR.filter((t) => !savedTickers.includes(t)).map((t) => <TickerChip key={t} ticker={t} />)}
        </div>
      </div>
    </div>
  );
}
