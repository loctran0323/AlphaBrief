"use client";

import { useTransition } from "react";
import { refreshMarketSummary } from "@/app/home/actions";

function ageLabel(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function MarketSummaryCard({
  summary,
  generatedAt,
}: {
  summary: string;
  generatedAt: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      await refreshMarketSummary();
    });
  }

  return (
    <div
      className="overflow-hidden rounded-xl bg-[var(--card)]"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          {/* Sparkle icon */}
          <svg
            className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
            AI Market Summary
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              background: "color-mix(in srgb, var(--accent) 12%, transparent)",
              color: "var(--accent)",
            }}
          >
            Gemini
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs text-[var(--faint)] transition-colors hover:text-[var(--foreground)] disabled:opacity-40"
        >
          <svg
            className={`h-3 w-3 ${isPending ? "animate-spin" : ""}`}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {isPending ? "Generating…" : `${ageLabel(generatedAt)} · Refresh`}
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="px-5 py-4">
        {isPending ? (
          <div className="space-y-2.5">
            <div className="h-4 w-full animate-pulse rounded bg-[var(--surface)]" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-[var(--surface)]" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--surface)]" />
            <div className="h-4 w-full animate-pulse rounded bg-[var(--surface)]" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--surface)]" />
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-[var(--foreground)]">
            {summary}
          </p>
        )}
      </div>
    </div>
  );
}
