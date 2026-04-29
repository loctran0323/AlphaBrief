"use client";

/**
 * MapV2Client – squarified treemap + advancing/declining table with tab toggle.
 * Features: Finviz-style hover card, zoom/fullscreen, mobile-responsive.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MarketMapRoot, MarketMapSector } from "@/lib/market-map-data";
import { treemapIndustryLabel } from "@/lib/market-map-data";
import type { NewsArticle } from "@/types/news";
import { AutoRefresh } from "@/components/auto-refresh";
import { checkAndRecordLookup } from "@/app/dashboard/map/actions";
import { LedgerMasthead, LedgerByline, LedgerRuleLabel } from "@/components/ledger-ui";

const SERIF_MP = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_MP  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT   = "#6C5CE7";

type Stock = [string, string, number, number];
type StockMeta = { shortName: string; price: number | null; changePct: number };
type MarketStatusInfo = { isOpen: boolean; label: string; reason: string; color: string };
type KickerItem = { label: string; value: string; sub: string };

type HoverStock = { sym: string; pct: number };
type HoverInfo = {
  hoveredSym: string;
  sec: string;
  sectorStocks: HoverStock[];
  x: number;
  y: number;
};

// ── Squarify ──────────────────────────────────────────────────────────────
type SqItem = { value: number } & Record<string, unknown>;
type SqRect<T> = T & { x: number; y: number; w: number; h: number };

function squarify<T extends SqItem>(items: T[], W: number, H: number): SqRect<T>[] {
  if (!items.length || W <= 0 || H <= 0) return [];
  const total = items.reduce((a, it) => a + it.value, 0);
  if (total <= 0) return [];
  const scale = (W * H) / total;
  const scaled = items.map(it => ({ ...it, _area: it.value * scale }));
  const out: SqRect<T>[] = [];
  let x = 0, y = 0, w = W, h = H;
  let i = 0;
  while (i < scaled.length) {
    const side = Math.min(w, h);
    const row: (typeof scaled[0])[] = [];
    let bestWorst = Infinity;
    let j = i;
    while (j < scaled.length) {
      row.push(scaled[j]!);
      const sum = row.reduce((a, r) => a + r._area, 0);
      const worst = Math.max(...row.map(r => {
        const a = r._area;
        return Math.max((side * side * a) / (sum * sum), (sum * sum) / (side * side * a));
      }));
      if (worst > bestWorst) { row.pop(); break; }
      bestWorst = worst;
      j++;
    }
    if (row.length === 0) break;
    const sum = row.reduce((a, r) => a + r._area, 0);
    if (w <= h) {
      const rowH = sum / w;
      let cx = x;
      for (const r of row) {
        const rw = r._area / rowH;
        out.push({ ...r, x: cx, y, w: rw, h: rowH } as SqRect<T>);
        cx += rw;
      }
      y += rowH; h -= rowH;
    } else {
      const rowW = sum / h;
      let cy = y;
      for (const r of row) {
        const rh = r._area / rowW;
        out.push({ ...r, x, y: cy, w: rowW, h: rh } as SqRect<T>);
        cy += rh;
      }
      x += rowW; w -= rowW;
    }
    i += row.length;
  }
  return out;
}

const mpFmt = (p: number) => `${p >= 0 ? "+" : ""}${p.toFixed(2)}%`;

const mpTone = (p: number, dark: boolean) => {
  const a = Math.min(Math.abs(p) / 10, 1);
  if (dark) return p >= 0
    ? `rgba(16,185,129,${(0.12 + a * 0.55).toFixed(3)})`
    : `rgba(244,63,94,${(0.12 + a * 0.55).toFixed(3)})`;
  return p >= 0
    ? `rgba(5,150,105,${(0.10 + a * 0.45).toFixed(3)})`
    : `rgba(220,38,38,${(0.10 + a * 0.45).toFixed(3)})`;
};

// ── Sector hover card (Finviz-style) ──────────────────────────────────────
function SectorHoverCard({
  info, metaMap, dark,
}: { info: HoverInfo; metaMap: Map<string, StockMeta>; dark: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: info.x + 14, top: info.y });

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    let left = info.x + 14;
    let top = info.y;
    if (left + cw > vw - 8) left = info.x - cw - 14;
    if (left < 8) left = 8;
    if (top + ch > vh - 8) top = Math.max(8, vh - ch - 8);
    setPos({ left, top });
  }, [info]);

  const bg    = dark ? "rgba(16,20,28,0.97)" : "rgba(255,255,255,0.97)";
  const bdr   = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.12)";
  const muted = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.40)";

  return (
    <div
      ref={cardRef}
      style={{
        position: "fixed",
        left: pos.left, top: pos.top,
        zIndex: 9999,
        background: bg,
        border: `1px solid ${bdr}`,
        boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.55)" : "0 8px 32px rgba(0,0,0,0.18)",
        minWidth: 280, maxWidth: 340,
        pointerEvents: "none",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div style={{
        padding: "8px 14px 6px",
        borderBottom: `1px solid ${bdr}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{
          fontFamily: SERIF_MP, fontStyle: "italic",
          fontSize: 13, fontWeight: 600,
          color: dark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)",
        }}>{info.sec}</span>
        <span style={{
          fontFamily: SANS_MP, fontSize: 9,
          letterSpacing: ".14em", textTransform: "uppercase",
          color: muted, fontWeight: 700,
        }}>{info.sectorStocks.length} stocks</span>
      </div>
      <div style={{ maxHeight: 340, overflowY: "auto" }}>
        {info.sectorStocks.map(s => {
          const meta = metaMap.get(s.sym.toUpperCase());
          const isActive = s.sym === info.hoveredSym;
          const rowBg = isActive
            ? (dark ? "rgba(108,92,231,0.18)" : "rgba(108,92,231,0.08)")
            : "transparent";
          return (
            <div key={s.sym} style={{
              display: "grid",
              gridTemplateColumns: "46px 1fr auto auto",
              alignItems: "baseline",
              gap: "0 8px",
              padding: "5px 14px",
              background: rowBg,
              borderLeft: isActive ? `2px solid ${ACCENT}` : "2px solid transparent",
            }}>
              <span style={{
                fontFamily: SERIF_MP,
                fontSize: isActive ? 13 : 12,
                fontWeight: isActive ? 700 : 600,
                color: dark ? (isActive ? "#fff" : "rgba(255,255,255,0.85)") : (isActive ? "#000" : "rgba(0,0,0,0.80)"),
                whiteSpace: "nowrap",
              }}>{s.sym}</span>
              <span style={{
                fontFamily: SANS_MP, fontSize: 11, color: muted,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{meta?.shortName ?? ""}</span>
              <span style={{
                fontFamily: "var(--ab-mono)", fontSize: 11,
                fontVariantNumeric: "tabular-nums",
                color: dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)",
                whiteSpace: "nowrap",
              }}>
                {meta?.price != null ? `$${meta.price.toFixed(2)}` : ""}
              </span>
              <span style={{
                fontFamily: "var(--ab-mono)", fontSize: 12,
                fontWeight: 700, fontVariantNumeric: "tabular-nums",
                color: s.pct >= 0 ? "var(--ab-up)" : "var(--ab-down)",
                whiteSpace: "nowrap", minWidth: 58, textAlign: "right",
              }}>{mpFmt(s.pct)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Treemap view ──────────────────────────────────────────────────────────
const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2, 3];
/** Minimum pixel width for the treemap canvas – keeps tiles legible on mobile. */
const MAP_MIN_PX = 820;

function MP_TreemapView({
  stocks, dark, metaMap, zoom, isFullscreen,
  onTileClick, onTileHover, onSectorLeave,
}: {
  stocks: Stock[];
  dark: boolean;
  metaMap: Map<string, StockMeta>;
  zoom: number;
  isFullscreen: boolean;
  onTileClick: (sym: string) => void;
  onTileHover: (info: HoverInfo | null) => void;
  onSectorLeave: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPct, setScrollPct] = useState(0);
  const [thumbPct, setThumbPct] = useState(0.4);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScrollPct(max > 0 ? el.scrollLeft / max : 0);
    setThumbPct(Math.max(0.12, el.clientWidth / el.scrollWidth));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setThumbPct(Math.max(0.12, el.clientWidth / el.scrollWidth));
  }, [zoom]);
  const sectorOrder: string[] = [];
  const bySec: Record<string, { sym: string; pct: number; cap: number }[]> = {};
  for (const [sec, sym, pct, cap] of stocks) {
    if (!(sec in bySec)) { bySec[sec] = []; sectorOrder.push(sec); }
    bySec[sec]!.push({ sym, pct, cap });
  }
  for (const sec of sectorOrder) bySec[sec]!.sort((a, b) => b.cap - a.cap);

  const W = 1040, H = 780, HEADER = 22;
  const sectorItems = sectorOrder.map(sec => ({
    sec,
    stocks: bySec[sec]!,
    value: bySec[sec]!.reduce((a, r) => a + r.cap, 0),
  }));
  const sectorBoxes = squarify(sectorItems, W, H);

  return (
    <>
    {/* scrollable wrapper – always scrollable on mobile, grows with zoom on desktop */}
    <div
      ref={scrollRef}
      onScroll={onScroll}
      style={{
        width: "100%",
        overflowX: "auto",
        overflowY: zoom > 1 ? "auto" : "hidden",
        maxHeight: isFullscreen ? "calc(100dvh - 64px)" : "none",
        // smooth momentum scroll on iOS
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        WebkitOverflowScrolling: "touch" as any,
      }}>
      <div style={{
        width: `${zoom * 100}%`,
        minWidth: `${MAP_MIN_PX}px`,
        aspectRatio: `${W} / ${H}`,
        position: "relative",
        border: "1px solid var(--ab-border)",
        background: "var(--ab-bg)",
      }}>
        {sectorBoxes.map(sb => {
          const innerX = 2, innerY = HEADER + 2;
          const innerW = Math.max(1, sb.w - 4);
          const innerH = Math.max(1, sb.h - HEADER - 4);
          const stockItems = sb.stocks.map(s => ({ ...s, value: s.cap }));
          const stockBoxes = squarify(stockItems, innerW, innerH);
          return (
            <div
              key={sb.sec}
              onMouseLeave={onSectorLeave}
              style={{
                position: "absolute",
                left: `${(sb.x / W) * 100}%`,
                top: `${(sb.y / H) * 100}%`,
                width: `${(sb.w / W) * 100}%`,
                height: `${(sb.h / H) * 100}%`,
                background: "var(--ab-card)",
                borderRight: "1px solid var(--ab-border)",
                borderBottom: "1px solid var(--ab-border)",
                overflow: "hidden",
              }}
            >
              {/* Sector header */}
              <div style={{
                position: "absolute", top: 4, left: 8, right: 8, height: HEADER - 4,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                fontFamily: SERIF_MP, fontStyle: "italic", fontSize: 12,
                color: "var(--ab-muted)", pointerEvents: "none",
              }}>
                <span>{sb.sec}</span>
                <span style={{
                  fontFamily: SANS_MP, fontStyle: "normal", fontSize: 9,
                  letterSpacing: ".12em", textTransform: "uppercase",
                  color: "var(--ab-faint)", fontWeight: 700,
                }}>{sb.stocks.length}</span>
              </div>

              {/* Stock tiles */}
              {stockBoxes.map(box => {
                const area = box.w * box.h;
                const showSym = box.w > 26 && box.h > 18;
                const showPct = area > 900 && box.h > 28;
                const bigSym = area > 3600;
                return (
                  <div
                    key={box.sym}
                    onClick={() => onTileClick(box.sym)}
                    onMouseEnter={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      onTileHover({
                        hoveredSym: box.sym,
                        sec: sb.sec,
                        sectorStocks: sb.stocks,
                        x: rect.right,
                        y: rect.top,
                      });
                    }}
                    title={`${box.sym} ${mpFmt(box.pct)}`}
                    style={{
                      position: "absolute",
                      left: `${((innerX + box.x) / sb.w) * 100}%`,
                      top: `${((innerY + box.y) / sb.h) * 100}%`,
                      width: `${(box.w / sb.w) * 100}%`,
                      height: `${(box.h / sb.h) * 100}%`,
                      background: mpTone(box.pct, dark),
                      border: "1px solid var(--ab-border)",
                      padding: bigSym ? "6px 8px" : "3px 5px",
                      display: "flex", flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: 0, overflow: "hidden",
                      cursor: "pointer", boxSizing: "border-box",
                    }}
                  >
                    {showSym && (
                      <div style={{
                        fontFamily: SERIF_MP,
                        fontSize: bigSym ? 15 : 11,
                        fontWeight: 600,
                        letterSpacing: "-.01em", lineHeight: 1.1,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{box.sym}</div>
                    )}
                    {showPct && (
                      <div style={{
                        fontFamily: "var(--ab-mono)",
                        fontVariantNumeric: "tabular-nums",
                        fontSize: bigSym ? 11 : 9,
                        fontWeight: 600,
                        color: box.pct >= 0 ? "var(--ab-up)" : "var(--ab-down)",
                        lineHeight: 1, whiteSpace: "nowrap",
                      }}>{mpFmt(box.pct)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
    {/* Mobile scroll progress bar */}
    <div className="sm:hidden" style={{ marginTop: 6, padding: "0 2px" }}>
      <div style={{ position: "relative", height: 6, background: "var(--ab-border)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: `${scrollPct * (1 - thumbPct) * 100}%`,
          width: `${thumbPct * 100}%`,
          height: "100%",
          background: ACCENT,
          borderRadius: 3,
          transition: "left 0.05s",
        }} />
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontFamily: SANS_MP, fontSize: 9, color: "var(--ab-faint)",
        marginTop: 4, letterSpacing: ".06em",
      }}>
        <span>← scroll</span>
        <span>scroll →</span>
      </div>
    </div>
    </>
  );
}

// ── Table view (mobile: one column at a time) ─────────────────────────────
function MP_TableView({
  stocks, dark, onTileClick,
}: { stocks: Stock[]; dark: boolean; onTileClick: (sym: string) => void }) {
  const [mobileTab, setMobileTab] = useState<"up" | "down">("up");
  const up   = stocks.filter(s => s[2] > 0).sort((a, b) => b[2] - a[2]);
  const down = stocks.filter(s => s[2] < 0).sort((a, b) => a[2] - b[2]);
  const maxAbs = Math.max(...up.map(s => s[2]), ...down.map(s => -s[2]), 0.01);

  function Row({ sec, sym, pct, side }: {
    sec: string; sym: string; pct: number; side: "up" | "down";
  }) {
    const barWidth = `${(Math.abs(pct) / maxAbs) * 100}%`;
    const color = side === "up" ? "var(--ab-up)" : "var(--ab-down)";
    const bg = side === "up"
      ? (dark ? "rgba(16,185,129,.18)" : "rgba(5,150,105,.14)")
      : (dark ? "rgba(244,63,94,.18)" : "rgba(220,38,38,.12)");
    return (
      <div
        onClick={() => onTileClick(sym)}
        style={{
          display: "grid",
          gridTemplateColumns: "52px 1fr 68px 1fr",
          padding: "8px 0",
          borderBottom: "1px solid var(--ab-border)",
          columnGap: 8, cursor: "pointer", alignItems: "center",
        }}
      >
        <span style={{ fontFamily: SERIF_MP, fontWeight: 600, fontSize: 14 }}>{sym}</span>
        <span style={{
          fontFamily: SERIF_MP, fontStyle: "italic",
          color: "var(--ab-muted)", fontSize: 12,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{sec}</span>
        <span style={{
          fontFamily: "var(--ab-mono)", fontVariantNumeric: "tabular-nums",
          fontWeight: 600, color, fontSize: 12, textAlign: "right",
        }}>{mpFmt(pct)}</span>
        <div style={{
          height: 8, background: bg,
          borderLeft: `2px solid ${color}`, width: barWidth,
        }} />
      </div>
    );
  }

  const ColHeader = ({ side }: { side: "up" | "down" }) => (
    <>
      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        marginBottom: 10,
        borderBottom: `2px solid ${side === "up" ? "var(--ab-up)" : "var(--ab-down)"}`,
        paddingBottom: 6,
      }}>
        {side === "up" ? (
          <>
            <span style={{ fontFamily: SERIF_MP, fontSize: 20, fontWeight: 600 }}>
              ↑ Advancing{" "}
              <span style={{ color: "var(--ab-muted)", fontSize: 14, fontStyle: "italic", fontWeight: 400 }}>
                · {up.length}
              </span>
            </span>
            <span style={{
              fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase",
              color: "var(--ab-faint)", fontWeight: 700,
            }}>today&apos;s best</span>
          </>
        ) : (
          <>
            <span style={{
              fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase",
              color: "var(--ab-faint)", fontWeight: 700,
            }}>today&apos;s worst</span>
            <span style={{ fontFamily: SERIF_MP, fontSize: 20, fontWeight: 600 }}>
              Declining{" "}
              <span style={{ color: "var(--ab-muted)", fontSize: 14, fontStyle: "italic", fontWeight: 400 }}>
                · {down.length}
              </span>{" "}↓
            </span>
          </>
        )}
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "52px 1fr 68px 1fr",
        padding: "6px 0", borderBottom: "1px solid var(--ab-border)",
        fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase",
        color: "var(--ab-faint)", fontWeight: 700, columnGap: 8,
      }}>
        <span>Sym</span><span>Sector</span>
        <span style={{ textAlign: "right" }}>Δ%</span><span></span>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile: tab strip to pick advancing vs declining */}
      <div className="sm:hidden" style={{
        display: "flex", gap: 0,
        borderBottom: "1px solid var(--ab-border)",
        marginBottom: 16,
      }}>
        {(["up", "down"] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setMobileTab(t)}
            style={{
              flex: 1, padding: "8px 0",
              fontFamily: SERIF_MP, fontSize: 15, fontWeight: mobileTab === t ? 600 : 400,
              color: mobileTab === t
                ? (t === "up" ? "var(--ab-up)" : "var(--ab-down)")
                : "var(--ab-muted)",
              background: "transparent", border: "none",
              borderBottom: mobileTab === t
                ? `2px solid ${t === "up" ? "var(--ab-up)" : "var(--ab-down)"}`
                : "2px solid transparent",
              marginBottom: -1, cursor: "pointer",
            }}
          >
            {t === "up" ? `↑ Advancing · ${up.length}` : `Declining · ${down.length} ↓`}
          </button>
        ))}
      </div>

      {/* Desktop: two columns */}
      <div className="hidden sm:grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        <div>
          <ColHeader side="up" />
          {up.map(([sec, sym, pct]) => (
            <Row key={sym} sec={sec} sym={sym} pct={pct} side="up" />
          ))}
        </div>
        <div>
          <ColHeader side="down" />
          {down.map(([sec, sym, pct]) => (
            <Row key={sym} sec={sec} sym={sym} pct={pct} side="down" />
          ))}
        </div>
      </div>

      {/* Mobile: single column */}
      <div className="sm:hidden">
        <ColHeader side={mobileTab} />
        {(mobileTab === "up" ? up : down).map(([sec, sym, pct]) => (
          <Row key={sym} sec={sec} sym={sym} pct={pct} side={mobileTab} />
        ))}
      </div>
    </>
  );
}

// ── Zoom toolbar ──────────────────────────────────────────────────────────
function ZoomToolbar({
  zoom, onZoom, isFullscreen, onToggleFullscreen,
}: {
  zoom: number;
  onZoom: (z: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const LEVELS = [0.5, 0.75, 1, 1.5, 2, 3];
  const idx = LEVELS.indexOf(zoom);

  const btn: React.CSSProperties = {
    fontFamily: SANS_MP, fontSize: 11, fontWeight: 700,
    letterSpacing: ".08em",
    background: "none", border: "1px solid var(--ab-border)",
    color: "var(--ab-muted)", padding: "4px 10px", cursor: "pointer",
  };

  return (
    <div style={{
      display: "flex", flexWrap: "nowrap", alignItems: "center", gap: 6,
      borderBottom: "1px solid var(--ab-border)", paddingBottom: 10, marginBottom: 12,
    }}>
      {/* "Map view" label – desktop only */}
      <span className="hidden sm:inline" style={{
        fontFamily: SANS_MP, fontSize: 9, fontWeight: 700,
        letterSpacing: ".14em", textTransform: "uppercase",
        color: "var(--ab-faint)", whiteSpace: "nowrap",
      }}>Map view</span>

      {/* Zoom control */}
      <div style={{
        display: "flex", alignItems: "center",
        border: "1px solid var(--ab-border)", background: "var(--ab-surface)",
      }}>
        <button
          type="button" aria-label="Zoom out"
          onClick={() => onZoom(LEVELS[Math.max(0, idx - 1)]!)}
          disabled={idx <= 0}
          style={{ ...btn, fontSize: 14, padding: "2px 9px", border: "none",
            borderRight: "1px solid var(--ab-border)", opacity: idx <= 0 ? 0.3 : 1 }}
        >−</button>
        <span style={{
          fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11,
          color: "var(--ab-fg)", minWidth: 42, textAlign: "center",
          fontVariantNumeric: "tabular-nums",
        }}>{Math.round(zoom * 100)}%</span>
        <button
          type="button" aria-label="Zoom in"
          onClick={() => onZoom(LEVELS[Math.min(LEVELS.length - 1, idx + 1)]!)}
          disabled={idx >= LEVELS.length - 1}
          style={{ ...btn, fontSize: 14, padding: "2px 9px", border: "none",
            borderLeft: "1px solid var(--ab-border)", opacity: idx >= LEVELS.length - 1 ? 0.3 : 1 }}
        >+</button>
      </div>

      <button type="button" onClick={() => onZoom(1)} style={{ ...btn, fontSize: 10, padding: "3px 8px" }}>
        Reset
      </button>

      {/* Scroll hint – mobile only */}
      <span className="sm:hidden" style={{
        fontFamily: SANS_MP, fontSize: 9, color: "var(--ab-faint)",
        marginLeft: 4, whiteSpace: "nowrap",
      }}>← scroll →</span>

      {/* Full screen – desktop only (not supported on mobile Safari) */}
      <button
        type="button"
        onClick={onToggleFullscreen}
        className="hidden sm:inline-block"
        style={{
          ...btn, fontSize: 10, padding: "3px 12px",
          marginLeft: "auto",
          background: ACCENT, color: "#fff", border: "none",
          whiteSpace: "nowrap",
        }}
      >
        {isFullscreen ? "Exit ⛶" : "Full screen ⛶"}
      </button>
    </div>
  );
}

// ── Tab toggle ────────────────────────────────────────────────────────────
function MP_Tabs({
  view, setView,
}: { view: "map" | "table"; setView: (v: "map" | "table") => void }) {
  const tabs = [
    { id: "map" as const,   label: "Market map",            hint: "Treemap" },
    { id: "table" as const, label: "Advancing & declining", hint: "Ranked table" },
  ];
  return (
    <div style={{
      display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      borderBottom: "1px solid var(--ab-border)", marginBottom: 24,
    }}>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {tabs.map(t => {
          const active = view === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setView(t.id)}
              style={{
                padding: "10px 14px 12px",
                fontFamily: SERIF_MP,
                fontSize: 15,
                fontWeight: active ? 600 : 500,
                color: active ? "var(--ab-fg)" : "var(--ab-muted)",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                borderBottom: active ? `2px solid ${ACCENT}` : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {/* Mobile: shorter label */}
              <span className="sm:hidden">{t.id === "map" ? "Map" : "Adv / Dec"}</span>
              {/* Desktop: full label */}
              <span className="hidden sm:inline">
                {t.label}
                <span style={{
                  fontFamily: SANS_MP, fontSize: 10,
                  letterSpacing: ".12em", textTransform: "uppercase",
                  color: "var(--ab-faint)", fontWeight: 600, marginLeft: 8,
                }}>{t.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Keyboard shortcut hint – desktop only */}
      <div className="hidden sm:flex" style={{ alignItems: "center", gap: 6, paddingBottom: 10 }}>
        <span style={{
          fontFamily: SANS_MP, fontSize: 9, letterSpacing: ".10em",
          textTransform: "uppercase", color: "var(--ab-faint)", fontWeight: 600,
        }}>Shortcut</span>
        <span style={{ color: "var(--ab-faint)", fontSize: 9 }}>·</span>
        {(["M", "T"] as const).map((k, i) => (
          <span key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <kbd style={{
              fontFamily: "var(--ab-mono)", fontSize: 10,
              border: "1px solid var(--ab-border)", padding: "2px 6px",
              borderRadius: 3, color: "var(--ab-muted)", background: "transparent",
            }}>{k}</kbd>
            <span style={{
              fontFamily: SANS_MP, fontSize: 9,
              color: "var(--ab-faint)", letterSpacing: ".04em",
            }}>{i === 0 ? "map" : "table"}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────
export function MapV2Client({
  tree,
  isPro = false,
  lookupsUsed = 0,
  maxLookups = 3,
  timeStr,
  marketStatus,
  kicker,
}: {
  tree: MarketMapRoot;
  isPro?: boolean;
  lookupsUsed?: number;
  maxLookups?: number;
  timeStr: string;
  marketStatus: MarketStatusInfo;
  kicker: { driver: KickerItem; green: KickerItem; drag: KickerItem; breadth: KickerItem };
}) {
  const { stocks, metaMap } = useMemo(() => {
    const stocks: Stock[] = [];
    const metaMap = new Map<string, StockMeta>();
    for (const sector of tree.children as MarketMapSector[]) {
      for (const industry of sector.children) {
        const label = treemapIndustryLabel(industry.name);
        for (const leaf of industry.children) {
          stocks.push([label, leaf.symbol, leaf.changePct ?? 0, leaf.size ?? 1]);
          metaMap.set(leaf.symbol.toUpperCase(), {
            shortName: leaf.shortName,
            price: leaf.price,
            changePct: leaf.changePct ?? 0,
          });
        }
      }
    }
    return { stocks, metaMap };
  }, [tree]);

  // Dark mode
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // View tab
  const [view, setView] = useState<"map" | "table">("map");

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement &&
        (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      if (e.key === "m" || e.key === "M") setView("map");
      if (e.key === "t" || e.key === "T") setView("table");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Zoom + fullscreen
  const [zoom, setZoom] = useState(1);
  const mapShellRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => {
      const el = mapShellRef.current;
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      setIsFullscreen(Boolean(el && (document.fullscreenElement === el || doc.webkitFullscreenElement === el)));
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = mapShellRef.current;
    if (!el) return;
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void>;
    };
    const hel = el as HTMLElement & { webkitRequestFullscreen?: () => void };
    try {
      if (document.fullscreenElement === el || doc.webkitFullscreenElement === el) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else await doc.webkitExitFullscreen?.();
      } else if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else {
        await hel.webkitRequestFullscreen?.();
      }
    } catch { /* ignore */ }
  }, []);

  // Hover card
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onTileHover = useCallback((info: HoverInfo | null) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    if (info) {
      setHoverInfo(info);
    } else {
      hoverTimeout.current = setTimeout(() => setHoverInfo(null), 80);
    }
  }, []);

  const onSectorLeave = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setHoverInfo(null), 80);
  }, []);

  // Headlines panel
  const [selected, setSelected] = useState<(StockMeta & { symbol: string }) | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<{ summary: string; sentiment: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [lookupsLeft, setLookupsLeft] = useState<number>(
    isPro ? Infinity : Math.max(0, maxLookups - lookupsUsed),
  );
  const [limitHit, setLimitHit] = useState(!isPro && lookupsUsed >= maxLookups);

  const loadNews = useCallback(async (symbol: string) => {
    setNewsLoading(true); setNewsError(null); setNews([]);
    try {
      const res = await fetch(`/api/news/ticker?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { articles?: NewsArticle[] };
      setNews(data.articles ?? []);
    } catch { setNewsError("Could not load headlines. Try again."); }
    finally { setNewsLoading(false); }
  }, []);

  const loadAiSummary = useCallback(async (sym: string, pct: number, price: number | null) => {
    setAiLoading(true); setAiSummary(null);
    try {
      const p = new URLSearchParams({ symbol: sym });
      p.set("changePct", pct.toFixed(4));
      if (price != null) p.set("price", price.toFixed(2));
      const res = await fetch(`/api/market/stock-summary?${p.toString()}`);
      if (!res.ok) throw new Error("Failed");
      setAiSummary((await res.json()) as { sentiment: string; summary: string });
    } catch { setAiSummary(null); }
    finally { setAiLoading(false); }
  }, []);

  const onTileClick = useCallback(async (symbol: string) => {
    const meta = metaMap.get(symbol.toUpperCase());
    if (!meta) return;
    if (!isPro) {
      if (lookupsLeft <= 0) { setLimitHit(true); return; }
      const result = await checkAndRecordLookup(symbol);
      if (!result.allowed) { setLimitHit(true); return; }
      setLookupsLeft(n => Math.max(0, isFinite(n) ? n - 1 : n));
    }
    setSelected({ ...meta, symbol });
    void loadNews(symbol);
    void loadAiSummary(symbol, meta.changePct, meta.price);
  }, [metaMap, isPro, lookupsLeft, loadNews, loadAiSummary]);

  const title = view === "map" ? "The map, in one glance." : "Gainers and losers, at a glance.";
  const dek = view === "map"
    ? "Each tile is a stock. Area encodes market capitalization; tint encodes today's move."
    : "A two-column ledger: advancers on the left, decliners on the right, sorted by the size of the move.";
  const bylineLeft = view === "map"
    ? `Treemap · ${stocks.length} tickers · live data · updated every 15 min`
    : `Ranked table · ${stocks.length} tickers`;
  const lookupsLabel = isPro
    ? "Unlimited"
    : `${isFinite(lookupsLeft) ? Math.max(0, lookupsLeft) : maxLookups} of ${maxLookups} lookups today`;

  return (
    <div style={{ paddingBottom: 64 }}>
      <AutoRefresh everyMs={900000} />
      <style>{`@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }`}</style>

      <LedgerMasthead eyebrow={`Cartography · ${timeStr}`} title={title} dek={dek} />

      <LedgerByline
        left={bylineLeft}
        right={
          <span style={{
            fontFamily: SANS_MP, fontSize: 11,
            color: "var(--ab-faint)", fontVariantNumeric: "tabular-nums",
          }}>{lookupsLabel}</span>
        }
      />

      {/* Legend + market status */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontSize: 10, color: "var(--ab-faint)", marginBottom: 10, gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <span>−10%</span>
            <div style={{
              width: 50, height: 4,
              background: dark
                ? "linear-gradient(90deg,rgba(244,63,94,.55),rgba(244,63,94,.12),rgba(16,185,129,.12),rgba(16,185,129,.55))"
                : "linear-gradient(90deg,rgba(220,38,38,.45),rgba(220,38,38,.10),rgba(5,150,105,.10),rgba(5,150,105,.45))",
            }} />
            <span>+10%</span>
          </div>
          <span className="hidden sm:inline" style={{ whiteSpace: "nowrap" }}>
            · area ∝ mkt cap · tap tile for headlines
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <span style={{ position: "relative", display: "inline-flex", width: 7, height: 7 }}>
            {marketStatus.isOpen && (
              <span style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: "50%", background: "#10B981", opacity: 0.5,
                animation: "ping 1.5s cubic-bezier(0,0,.2,1) infinite",
              }} />
            )}
            <span style={{
              position: "relative", display: "inline-flex",
              width: 7, height: 7, borderRadius: "50%",
              background: marketStatus.color === "green" ? "#10B981"
                : marketStatus.color === "yellow" ? "#F59E0B" : "#EF4444",
            }} />
          </span>
          <span style={{
            fontFamily: SANS_MP, fontSize: 10, fontWeight: 600,
            color: "var(--ab-fg)", whiteSpace: "nowrap",
          }}>{marketStatus.label}</span>
          <span style={{ whiteSpace: "nowrap" }}>· {marketStatus.reason}</span>
        </div>
      </div>

      {/* Limit banner */}
      {limitHit && (
        <div style={{
          border: `2px solid ${ACCENT}`, background: "var(--ab-surface-hi)",
          padding: "24px 32px", textAlign: "center", marginBottom: 20,
        }}>
          <p style={{ fontFamily: SERIF_MP, fontSize: 18, fontWeight: 600, color: "var(--ab-fg)", margin: 0 }}>
            Daily limit reached
          </p>
          <p style={{
            fontFamily: SERIF_MP, fontStyle: "italic", fontSize: 14,
            color: "var(--ab-muted)", marginTop: 6,
          }}>
            Free members get {maxLookups} market map lookups per day.
            Upgrade to Pro for unlimited access.
          </p>
          <a href="/dashboard/upgrade" style={{
            display: "inline-block", marginTop: 14, padding: "8px 20px",
            background: ACCENT, color: "#fff",
            fontFamily: SANS_MP, fontSize: 11, fontWeight: 600,
            letterSpacing: ".1em", textTransform: "uppercase", textDecoration: "none",
          }}>Upgrade to Pro</a>
        </div>
      )}

      {/* Headlines panel */}
      {!selected ? (
        <p style={{
          fontFamily: SERIF_MP, fontStyle: "italic",
          fontSize: 12, color: "var(--ab-muted)", marginBottom: 16,
        }}>
          Tile size correlated with market cap.
          Tap a tile to see headlines and why it&apos;s moving.
        </p>
      ) : (
        <div style={{
          border: "1px solid var(--ab-border)", background: "var(--ab-card)",
          padding: "20px 24px", minHeight: 140, marginBottom: 20,
        }}>
          <div style={{
            display: "flex", flexWrap: "wrap",
            alignItems: "baseline", gap: "6px 12px", marginBottom: 12,
          }}>
            <span style={{ fontFamily: SERIF_MP, fontSize: 20, fontWeight: 600, color: "var(--ab-fg)" }}>
              {selected.shortName ?? selected.symbol}
            </span>
            <span style={{ fontFamily: SANS_MP, fontSize: 12, color: "var(--ab-muted)", fontVariantNumeric: "tabular-nums" }}>
              {selected.symbol}
            </span>
            {selected.price != null && (
              <span style={{ fontFamily: SERIF_MP, fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                ${selected.price.toFixed(2)}
              </span>
            )}
            <span style={{
              fontFamily: SANS_MP, fontSize: 13, fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              color: selected.changePct >= 0 ? "var(--ab-up)" : "var(--ab-down)",
            }}>
              {selected.changePct >= 0 ? "+" : ""}{selected.changePct.toFixed(2)}%
            </span>
          </div>
          {aiLoading && (
            <p style={{ fontFamily: SERIF_MP, fontStyle: "italic", fontSize: 13, color: "var(--ab-muted)" }}>
              Analysing move…
            </p>
          )}
          {!aiLoading && aiSummary?.summary && (
            <p style={{ fontFamily: SERIF_MP, fontSize: 14, lineHeight: 1.6, color: "var(--ab-muted)", marginBottom: 14 }}>
              {aiSummary.summary}
            </p>
          )}
          {newsLoading && (
            <p style={{ fontFamily: SERIF_MP, fontStyle: "italic", fontSize: 13, color: "var(--ab-muted)" }}>
              Loading headlines…
            </p>
          )}
          {newsError && (
            <p style={{ fontFamily: SANS_MP, fontSize: 12, color: "var(--ab-down)" }} role="alert">
              {newsError}
            </p>
          )}
          {!newsLoading && news.length > 0 && (
            <div style={{ maxHeight: "min(52vh, 480px)", overflowY: "auto" }}>
              {news.slice(0, 6).map(a => (
                <div key={a.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--ab-border)" }}>
                  <p style={{
                    fontFamily: SERIF_MP, fontSize: 15, fontWeight: 600,
                    lineHeight: 1.25, color: "var(--ab-fg)", marginBottom: 4,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>{a.title}</p>
                  {a.summary && (
                    <p style={{
                      fontFamily: SERIF_MP, fontSize: 13,
                      color: "var(--ab-muted)", lineHeight: 1.55, marginBottom: 6,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>{a.summary}</p>
                  )}
                  <a href={a.url} target="_blank" rel="noreferrer" style={{
                    fontFamily: SANS_MP, fontSize: 11, color: ACCENT,
                    letterSpacing: ".04em", textDecoration: "none",
                  }}>Original article →</a>
                </div>
              ))}
            </div>
          )}
          {!newsLoading && !newsError && news.length === 0 && (
            <p style={{ fontFamily: SERIF_MP, fontStyle: "italic", fontSize: 13, color: "var(--ab-muted)" }}>
              No headlines matched this symbol yet. Try again later.
            </p>
          )}
        </div>
      )}

      {/* Tab toggle */}
      <MP_Tabs view={view} setView={setView} />

      {/* Views */}
      {view === "map" && (
        <div
          ref={mapShellRef}
          style={isFullscreen ? {
            display: "flex", flexDirection: "column",
            height: "100dvh", width: "100%",
            background: "var(--ab-bg)", padding: 16,
          } : {
            display: "flex", flexDirection: "column",
          }}
        >
          <ZoomToolbar
            zoom={zoom}
            onZoom={setZoom}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
          />
          <MP_TreemapView
            stocks={stocks}
            dark={dark}
            metaMap={metaMap}
            zoom={zoom}
            isFullscreen={isFullscreen}
            onTileClick={onTileClick}
            onTileHover={onTileHover}
            onSectorLeave={onSectorLeave}
          />
        </div>
      )}
      {view === "table" && (
        <MP_TableView stocks={stocks} dark={dark} onTileClick={onTileClick} />
      )}

      {/* Hover card overlay */}
      {hoverInfo && view === "map" && (
        <SectorHoverCard info={hoverInfo} metaMap={metaMap} dark={dark} />
      )}

      {/* Kickers */}
      <LedgerRuleLabel>What the map is saying</LedgerRuleLabel>
      <div className="grid ab-kicker-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 32 }}>
        {[kicker.driver, kicker.green, kicker.drag, kicker.breadth].map(item => (
          <div key={item.label} style={{ borderTop: "1px solid var(--ab-border)", paddingTop: 12 }}>
            <div style={{
              fontFamily: SANS_MP, fontSize: 10, letterSpacing: ".22em",
              textTransform: "uppercase", color: "var(--ab-faint)",
              fontWeight: 700, marginBottom: 6,
            }}>{item.label}</div>
            <div style={{ fontFamily: SERIF_MP, fontSize: 20, fontWeight: 600, lineHeight: 1.15 }}>
              {item.value}
            </div>
            {item.sub && (
              <div style={{ fontFamily: SERIF_MP, fontStyle: "italic", fontSize: 13, color: "var(--ab-muted)", marginTop: 4 }}>
                {item.sub}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
