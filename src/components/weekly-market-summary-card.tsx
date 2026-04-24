/**
 * Weekly market recap rendered as editorial prose — matches LP_Archive reference:
 * h2 headline + 2-col grid (drop-cap lede | pull-quote).
 * No headers, no bullet list, no "WEEKLY MARKET RECAP" chip.
 */

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

/** Strip **HEADER** markers and bullet prefixes, return plain lines. */
function parseWeeklySummary(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !(l.startsWith("**") && l.endsWith("**")))
    .map((l) => l.replace(/^[•\-]\s*/, ""));
}

export function WeeklyMarketSummaryCard({
  summary,
  generatedAt,
}: {
  summary: string;
  generatedAt: string;
}) {
  const lines = parseWeeklySummary(summary);
  if (lines.length === 0) return null;

  const headline  = lines[0] ?? "";
  const ledeFirst = lines[1] ?? lines[0] ?? "";
  const ledeRest  = lines.slice(2, 4);
  const pullQuote = lines[4] ?? lines[3] ?? lines[2] ?? "";

  const dropChar  = ledeFirst[0] ?? "T";
  const afterDrop = ledeFirst.slice(1);

  const timeStr = generatedAt
    ? new Date(generatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div style={{ fontFamily: SERIF_L, color: "var(--ab-fg)" }}>
      {/* Headline */}
      <h2 style={{
        fontFamily: SERIF_L, fontSize: 28, fontWeight: 600,
        letterSpacing: "-.02em", lineHeight: 1.15, marginBottom: 12,
      }}>
        {headline}
      </h2>

      {timeStr && (
        <p style={{ fontFamily: SANS_L, fontSize: 11, color: "var(--ab-faint)", marginBottom: 14 }}>
          Updated {timeStr}
        </p>
      )}

      {/* 2-col: lede | pull-quote */}
      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 40 }}>
        {/* Left — drop-cap lede */}
        <div style={{ fontSize: 16, lineHeight: 1.7 }}>
          <p style={{ marginBottom: 12 }}>
            <span style={{
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

        {/* Right — pull-quote */}
        {pullQuote && (
          <div style={{
            borderLeft: `3px solid ${ACCENT}`,
            padding: "4px 0 4px 18px",
            fontStyle: "italic", fontSize: 18, lineHeight: 1.35,
            color: "var(--ab-fg)",
          }}>
            &ldquo;{pullQuote}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
