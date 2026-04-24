"use client";

import { useState } from "react";
import type { MarketEvent } from "@/types/database";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

type EventType = MarketEvent["event_type"];

const typeConfig: Record<EventType, { label: string; color: string; bg: string }> = {
  macro: {
    label: "Macro",
    color: "#0284C7",
    bg: "rgba(2,132,199,.10)",
  },
  earnings: {
    label: "Earnings",
    color: ACCENT,
    bg: "rgba(108,92,231,.10)",
  },
  catalyst: {
    label: "Key event",
    color: "#D97706",
    bg: "rgba(217,119,6,.10)",
  },
};

function formatCalendarDate(iso: string): { day: string; monthTime: string } {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { day: "?", monthTime: "TBD" };
  const day = String(d.getDate());
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return { day, monthTime: `${month} · ${time}` };
}

type Props = {
  event: MarketEvent;
  showTickerBadge?: boolean;
  readMoreUrl?: string | null;
  archiveMode?: boolean;
};

export function EventCard({ event, showTickerBadge = true, readMoreUrl, archiveMode = false }: Props) {
  const cfg = typeConfig[event.event_type];
  const ticker = event.ticker?.trim();
  const { day, monthTime } = formatCalendarDate(event.event_date);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiShown, setAiShown] = useState(false);

  const loadAiSummary = async () => {
    if (aiShown) { setAiShown(false); return; }
    if (aiSummary) { setAiShown(true); return; }
    setAiLoading(true);
    setAiShown(true);
    try {
      const params = new URLSearchParams({
        title: event.title,
        date: event.event_date,
        eventType: event.event_type,
      });
      const res = await fetch(`/api/events/ai-summary?${params.toString()}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as { summary?: string };
      setAiSummary(data.summary ?? "No summary available.");
    } catch {
      setAiSummary("Could not load AI summary.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", padding: "14px 0", borderBottom: "1px solid var(--ab-border)" }}>
      {/* ── Left date column ── */}
      <div style={{ width: 140, flexShrink: 0 }}>
        <div style={{
          fontFamily: SERIF_L, fontSize: 22, fontWeight: 600,
          color: "var(--ab-fg)", lineHeight: 1,
        }}>
          {day}
        </div>
        <div style={{ fontFamily: SANS_L, fontSize: 11, color: "var(--ab-muted)", marginTop: 4 }}>
          {monthTime}
        </div>
        <div style={{
          display: "inline-block", marginTop: 8,
          fontFamily: SANS_L, fontSize: 10, fontWeight: 700,
          letterSpacing: ".14em", textTransform: "uppercase",
          color: cfg.color, background: cfg.bg, padding: "2px 7px",
        }}>
          {cfg.label}
        </div>
        {showTickerBadge && ticker && (
          <div style={{
            display: "inline-block", marginTop: 4, marginLeft: 4,
            fontFamily: SANS_L, fontSize: 10, fontWeight: 700,
            color: "var(--ab-fg)", border: "1px solid var(--ab-border)",
            background: "var(--ab-surface)", padding: "2px 7px",
          }}>
            {ticker}
          </div>
        )}
      </div>

      {/* ── Right content ── */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: SERIF_L, fontSize: 19, fontWeight: 600,
          lineHeight: 1.25, letterSpacing: "-.01em",
          color: "var(--ab-fg)", marginBottom: 6,
        }}>
          {event.title}
        </div>
        <div style={{ fontFamily: SERIF_L, fontSize: 13, color: "var(--ab-muted)", lineHeight: 1.55, marginBottom: 6 }}>
          {event.why_it_matters}
        </div>
        <div style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 12, color: "var(--ab-faint)" }}>
          Watch for: {event.watch_for}
        </div>

        {/* AI summary (archive mode) */}
        {archiveMode && aiShown && (
          <div style={{ marginTop: 14, borderTop: "1px solid var(--ab-border)", paddingTop: 12 }}>
            <p style={{
              fontFamily: SANS_L, fontSize: 10, fontWeight: 700,
              letterSpacing: ".14em", textTransform: "uppercase",
              color: "var(--ab-faint)", marginBottom: 6,
            }}>What happened</p>
            {aiLoading ? (
              <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 13, color: "var(--ab-muted)" }}>Loading…</p>
            ) : (
              <p style={{ fontFamily: SERIF_L, fontSize: 14, lineHeight: 1.6, color: "var(--ab-fg)" }}>{aiSummary}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
          {readMoreUrl && (
            <a
              href={readMoreUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontFamily: SANS_L, fontSize: 11, color: ACCENT, letterSpacing: ".06em", textDecoration: "none" }}
            >
              Read coverage →
            </a>
          )}
          {archiveMode && (
            <button
              type="button"
              onClick={loadAiSummary}
              style={{
                fontFamily: SANS_L, fontSize: 11, color: "var(--ab-muted)",
                background: "none", border: "none", cursor: "pointer", padding: 0, letterSpacing: ".04em",
              }}
            >
              {aiShown ? "Hide AI summary" : "What happened? →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
