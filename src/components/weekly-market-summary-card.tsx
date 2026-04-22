/**
 * Renders the weekly summary text, turning **bold** markers into styled section headers
 * and • lines into indented bullet points.
 */
function FormattedSummary({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.startsWith("•") || line.startsWith("-")) {
          return (
            <div key={i} className="flex gap-2 text-sm leading-relaxed text-[var(--foreground)]">
              <span className="mt-0.5 shrink-0 text-[var(--accent)]">•</span>
              <span>{line.replace(/^[•\-]\s*/, "")}</span>
            </div>
          );
        }
        return (
          <p key={i} className="text-sm leading-relaxed text-[var(--foreground)]">
            {line}
          </p>
        );
      })}
    </div>
  );
}

export function WeeklyMarketSummaryCard({
  summary,
}: {
  summary: string;
  generatedAt: string;
}) {
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
          <svg className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
            Weekly Market Recap
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }}
          >
            Groq
          </span>
        </div>
        <span className="text-xs text-[var(--faint)]">Updated every 24 hours</span>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="px-5 py-5">
        <FormattedSummary text={summary} />
      </div>
    </div>
  );
}
