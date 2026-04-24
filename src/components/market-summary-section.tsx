import { Suspense } from "react";
import { getMarketSummary } from "@/lib/market-summary";
import { MarketSummaryCard } from "@/components/market-summary-card";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const ACCENT  = "#6C5CE7";

function MarketSummarySkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--ab-surface)", animation: "pulse 1.5s infinite" }} />
        <div style={{ height: 10, width: 120, background: "var(--ab-surface)", borderRadius: 2, animation: "pulse 1.5s infinite" }} />
      </div>
      {[1, 0.92, 0.8, 1, 0.75].map((w, i) => (
        <div key={i} style={{ height: 16, width: `${w * 100}%`, background: "var(--ab-surface)", borderRadius: 2, animation: "pulse 1.5s infinite" }} />
      ))}
    </div>
  );
}

async function MarketSummaryInner() {
  try {
    const result = await getMarketSummary();
    if (!result) return <MarketSummaryUnavailable />;
    return <MarketSummaryCard summary={result.summary} generatedAt={result.generatedAt} />;
  } catch {
    return <MarketSummaryUnavailable />;
  }
}

function MarketSummaryUnavailable() {
  return (
    <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 14, color: "var(--ab-faint)" }}>
      Summary temporarily unavailable — the AI is rate-limited. It will retry automatically on the next load.
    </p>
  );
}

export function MarketSummarySection() {
  return (
    <Suspense fallback={<MarketSummarySkeleton />}>
      <MarketSummaryInner />
    </Suspense>
  );
}
