/**
 * Async server component — streams the AI summary into the page via Suspense.
 * The rest of the home page renders immediately while this fetches.
 */

import { Suspense } from "react";
import { getMarketSummary } from "@/lib/market-summary";
import { MarketSummaryCard } from "@/components/market-summary-card";

// Shown while the summary is being fetched / generated
function MarketSummarySkeleton() {
  return (
    <div
      className="overflow-hidden rounded-xl bg-[var(--card)]"
      style={{ border: "1px solid var(--border)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 animate-pulse rounded-full bg-[var(--surface)]" />
          <div className="h-3 w-32 animate-pulse rounded bg-[var(--surface)]" />
          <div className="h-4 w-14 animate-pulse rounded-full bg-[var(--surface)]" />
        </div>
        <div className="h-3 w-24 animate-pulse rounded bg-[var(--surface)]" />
      </div>
      <div className="space-y-2.5 px-5 py-4">
        <div className="h-4 w-full animate-pulse rounded bg-[var(--surface)]" />
        <div className="h-4 w-11/12 animate-pulse rounded bg-[var(--surface)]" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--surface)]" />
        <div className="h-4 w-full animate-pulse rounded bg-[var(--surface)]" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--surface)]" />
      </div>
    </div>
  );
}

async function MarketSummaryInner() {
  const result = await getMarketSummary();
  if (!result) return null; // GEMINI_API_KEY not set — silently omit
  return (
    <MarketSummaryCard summary={result.summary} generatedAt={result.generatedAt} />
  );
}

export function MarketSummarySection() {
  return (
    <section>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
        AI Market Summary
      </p>
      <Suspense fallback={<MarketSummarySkeleton />}>
        <MarketSummaryInner />
      </Suspense>
    </section>
  );
}
