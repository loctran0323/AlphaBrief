/**
 * Editorial lede + pull-quote for the dashboard — matches L_Dashboard reference.
 * Replaces the old "AI MARKET SUMMARY" card with drop-cap prose + right pull-quote.
 */

import { Suspense } from "react";
import { getMarketSummary } from "@/lib/market-summary";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

/** Strip **HEADER** markers and split into bullets / prose lines. */
function parseSummary(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !(l.startsWith("**") && l.endsWith("**"))) // drop headers
    .map((l) => l.replace(/^[•\-]\s*/, "")); // strip bullet markers
}

function DashboardLedeContent({ summary }: { summary: string }) {
  const lines = parseSummary(summary);
  if (lines.length === 0) return <DashboardLedeUnavailable />;

  const ledeFirst = lines[0] ?? "";
  const ledeRest  = lines.slice(1, 3); // next 1–2 lines as additional paragraphs
  const keyPoints = lines.slice(3, 7); // up to 4 key points
  const pullQuote = lines[2] ?? lines[1] ?? lines[0] ?? "";

  const dropChar = ledeFirst[0] ?? "T";
  const afterDrop = ledeFirst.slice(1);

  return (
    <div className="grid ab-lede-grid" style={{ gridTemplateColumns: "1.6fr 1fr", gap: 40, marginBottom: 8 }}>
      {/* Left — lede prose */}
      <div className="ab-lede-prose" style={{ fontFamily: SERIF_L, fontSize: 16, lineHeight: 1.7, color: "var(--ab-fg)" }}>
        <p style={{ marginBottom: 14 }}>
          <span className="ab-drop-cap" style={{
            float: "left", fontFamily: SERIF_L,
            fontSize: 52, lineHeight: 0.9, paddingTop: 4, paddingRight: 8,
            color: ACCENT, fontWeight: 700,
          }}>
            {dropChar}
          </span>
          {afterDrop}
        </p>
        {ledeRest.map((line, i) => (
          <p key={i} style={{ color: "var(--ab-muted)", marginBottom: 10 }}>{line}</p>
        ))}
      </div>

      {/* Right — pull-quote + key points (hidden on mobile) */}
      <div className="ab-lede-right">
        {pullQuote && (
          <div style={{
            borderLeft: `3px solid ${ACCENT}`,
            padding: "4px 0 4px 18px",
            fontFamily: SERIF_L, fontSize: 18, lineHeight: 1.35,
            fontStyle: "italic", color: "var(--ab-fg)",
            marginBottom: 20,
          }}>
            &ldquo;{pullQuote}&rdquo;
          </div>
        )}
        {keyPoints.length > 0 && (
          <div>
            <div style={{
              fontFamily: SANS_L, fontSize: 10, letterSpacing: ".22em",
              textTransform: "uppercase", color: "var(--ab-faint)",
              fontWeight: 700, marginBottom: 8,
            }}>
              Key points
            </div>
            <ol style={{
              listStyle: "decimal", paddingLeft: 18,
              color: "var(--ab-muted)", fontSize: 13, lineHeight: 1.7,
              fontFamily: SERIF_L,
            }}>
              {keyPoints.map((k, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{k}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

async function DashboardLedeInner() {
  try {
    const result = await getMarketSummary();
    if (!result) return <DashboardLedeUnavailable />;
    return <DashboardLedeContent summary={result.summary} />;
  } catch {
    return <DashboardLedeUnavailable />;
  }
}

function DashboardLedeUnavailable() {
  return (
    <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 15, color: "var(--ab-muted)", marginBottom: 8 }}>
      Today&apos;s market summary is temporarily unavailable. Check back shortly.
    </p>
  );
}

function DashboardLedeSkeleton() {
  return (
    <div className="grid ab-lede-grid" style={{ gridTemplateColumns: "1.6fr 1fr", gap: 40, marginBottom: 8 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1, 0.9, 0.95, 0.85, 1, 0.92, 0.88, 0.75].map((w, i) => (
          <div key={i} style={{
            height: 16, width: `${w * 100}%`,
            background: "var(--ab-surface)", borderRadius: 2,
            animation: "pulse 1.5s infinite",
          }} />
        ))}
      </div>
      <div>
        <div style={{ borderLeft: `3px solid ${ACCENT}`, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {[1, 0.88, 0.82, 0.9].map((w, i) => (
            <div key={i} style={{
              height: 18, width: `${w * 100}%`,
              background: "var(--ab-surface)", borderRadius: 2,
              animation: "pulse 1.5s infinite",
            }} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[0.9, 0.85, 0.88, 0.8].map((w, i) => (
            <div key={i} style={{
              height: 14, width: `${w * 100}%`,
              background: "var(--ab-surface)", borderRadius: 2,
              animation: "pulse 1.5s infinite",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardLedeSection() {
  return (
    <Suspense fallback={<DashboardLedeSkeleton />}>
      <DashboardLedeInner />
    </Suspense>
  );
}
