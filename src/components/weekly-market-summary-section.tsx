/**
 * Async server component — streams the weekly AI recap into the archive page via Suspense.
 */

import { Suspense } from "react";
import { getWeeklyMarketSummary } from "@/lib/market-summary";
import { WeeklyMarketSummaryCard } from "@/components/weekly-market-summary-card";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

function WeeklyMarketSummarySkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--ab-surface)", animation: "pulse 1.5s infinite" }} />
        <div style={{ height: 10, width: 160, background: "var(--ab-surface)", borderRadius: 2, animation: "pulse 1.5s infinite" }} />
      </div>
      {[1, 0.92, 0.85, 1, 0.88, 0.78, 1, 0.72].map((w, i) => (
        <div key={i} style={{ height: 16, width: `${w * 100}%`, background: "var(--ab-surface)", borderRadius: 2, animation: "pulse 1.5s infinite" }} />
      ))}
    </div>
  );
}

async function WeeklyMarketSummaryInner() {
  try {
    const result = await getWeeklyMarketSummary();
    if (!result) return <WeeklyMarketSummaryUnavailable />;
    return (
      <WeeklyMarketSummaryCard summary={result.summary} generatedAt={result.generatedAt} />
    );
  } catch {
    return <WeeklyMarketSummaryUnavailable />;
  }
}

function WeeklyMarketSummaryUnavailable() {
  return (
    <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 14, color: "var(--ab-faint)" }}>
      Weekly recap temporarily unavailable — the AI is rate-limited. It will retry automatically on the next page load.
    </p>
  );
}

export function WeeklyMarketSummarySection() {
  return (
    <Suspense fallback={<WeeklyMarketSummarySkeleton />}>
      <WeeklyMarketSummaryInner />
    </Suspense>
  );
}
