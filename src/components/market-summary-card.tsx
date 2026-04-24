"use client";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

function FormattedSummary({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} style={{
              fontFamily: SANS_L, fontSize: 10, fontWeight: 700,
              letterSpacing: ".22em", textTransform: "uppercase", color: ACCENT, margin: 0,
            }}>
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.startsWith("•") || line.startsWith("-")) {
          return (
            <div key={i} style={{ display: "flex", gap: 8, fontFamily: SERIF_L, fontSize: 15, lineHeight: 1.6, color: "var(--ab-fg)" }}>
              <span style={{ color: ACCENT, flexShrink: 0 }}>•</span>
              <span>{line.replace(/^[•\-]\s*/, "")}</span>
            </div>
          );
        }
        return (
          <p key={i} style={{ fontFamily: SERIF_L, fontSize: 15, lineHeight: 1.65, color: "var(--ab-fg)", margin: 0 }}>
            {line}
          </p>
        );
      })}
    </div>
  );
}

export function MarketSummaryCard({
  summary,
  generatedAt,
}: {
  summary: string;
  generatedAt: string;
}) {
  const timeStr = generatedAt
    ? new Date(generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })
    : null;

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14, fontFamily: SANS_L, fontSize: 11, color: "var(--ab-faint)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg style={{ width: 12, height: 12, color: ACCENT, flexShrink: 0 }} viewBox="0 0 24 24" fill={ACCENT}>
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z" />
          </svg>
          <span style={{ letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 700 }}>AI Market Summary</span>
          <span style={{ padding: "1px 6px", background: "rgba(108,92,231,.12)", color: ACCENT, fontWeight: 700, fontSize: 9 }}>Groq</span>
        </div>
        {timeStr && (
          <span style={{ fontFamily: SERIF_L, fontStyle: "italic" }}>Updated {timeStr}</span>
        )}
      </div>
      <FormattedSummary text={summary} />
    </div>
  );
}
