"use client";

/**
 * MapV2Client — squarified treemap + advancing/declining table with tab toggle.
 * Ported from design_handoff_map/map-combined.jsx; wired to real AlphaBrief data.
 * Preserves the tile-click → headlines panel from the original MarketMapExplorer.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MarketMapRoot, MarketMapSector } from "@/lib/market-map-data";
import { treemapIndustryLabel } from "@/lib/market-map-data";
import type { NewsArticle } from "@/types/news";
import { AutoRefresh } from "@/components/auto-refresh";
import { checkAndRecordLookup } from "@/app/dashboard/map/actions";
import { LedgerMasthead, LedgerByline, LedgerRuleLabel } from "@/components/ledger-ui";

const SERIF_MP = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_MP  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT   = "#6C5CE7";

// [industryLabel, symbol, changePct, sizeProxy]
type Stock = [string, string, number, number];
type StockMeta = { shortName: string; price: number | null; changePct: number };
type MarketStatusInfo = { isOpen: boolean; label: string; reason: string; color: string };
type KickerItem = { label: string; value: string; sub: string };

// ── Squarify algorithm ────────────────────────────────────────────────────
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

// ── Color helpers ─────────────────────────────────────────────────────────
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

// ── Treemap View ──────────────────────────────────────────────────────────
function MP_TreemapView({
  stocks, dark, onTileClick,
}: { stocks: Stock[]; dark: boolean; onTileClick: (sym: string) => void }) {
  const sectorOrder: string[] = [];
  const bySec: Record<string, { sym: string; pct: number; cap: number }[]> = {};
  for (const [sec, sym, pct, cap] of stocks) {
    if (!(sec in bySec)) { bySec[sec] = []; sectorOrder.push(sec); }
    bySec[sec]!.push({ sym, pct, cap });
  }
  for (const sec of sectorOrder) bySec[sec]!.sort((a, b) => b.cap - a.cap);

  const sectorItems = sectorOrder.map(sec => ({
    sec,
    stocks: bySec[sec]!,
    value: bySec[sec]!.reduce((a, r) => a + r.cap, 0),
  }));

  const W = 1040, H = 780, HEADER = 22;
  const sectorBoxes = squarify(sectorItems, W, H);

  return (
    <div style={{
      border: "1px solid var(--ab-border)", background: "var(--ab-bg)",
      position: "relative", width: "100%", aspectRatio: `${W} / ${H}`,
    }}>
      {sectorBoxes.map(sb => {
        const innerX = 2, innerY = HEADER + 2;
        const innerW = Math.max(1, sb.w - 4);
        const innerH = Math.max(1, sb.h - HEADER - 4);
        const stockItems = sb.stocks.map(s => ({ ...s, value: s.cap }));
        const stockBoxes = squarify(stockItems, innerW, innerH);
        return (
          <div key={sb.sec} style={{
            position: "absolute",
            left: `${(sb.x / W) * 100}%`,
            top: `${(sb.y / H) * 100}%`,
            width: `${(sb.w / W) * 100}%`,
            height: `${(sb.h / H) * 100}%`,
            background: "var(--ab-card)",
            borderRight: "1px solid var(--ab-border)",
            borderBottom: "1px solid var(--ab-border)",
            overflow: "hidden",
          }}>
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
  );
}

// ── Table View ────────────────────────────────────────────────────────────
function MP_TableView({
  stocks, dark, onTileClick,
}: { stocks: Stock[]; dark: boolean; onTileClick: (sym: string) => void }) {
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
          gridTemplateColumns: side === "up"
            ? "56px 1fr 72px 1fr"
            : "72px 1fr 56px",
          padding: "8px 0",
          borderBottom: "1px solid var(--ab-border)",
          fontFamily: SANS_MP, fontSize: 13,
          columnGap: 10, cursor: "pointer", alignItems: "center",
        }}
      >
        {side === "up" ? (
          <>
            <span style={{ fontFamily: SERIF_MP, fontWeight: 600 }}>{sym}</span>
            <span style={{
              fontFamily: SERIF_MP, fontStyle: "italic",
              color: "var(--ab-muted)", fontSize: 12,
            }}>{sec}</span>
            <span style={{
              fontFamily: "var(--ab-mono)", fontVariantNumeric: "tabular-nums",
              fontWeight: 600, color, fontSize: 12, textAlign: "right",
            }}>{mpFmt(pct)}</span>
            <div style={{
              height: 8, background: bg,
              borderLeft: `2px solid ${color}`,
              width: barWidth,
            }} />
          </>
        ) : (
          <>
            <span style={{
              fontFamily: "var(--ab-mono)", fontVariantNumeric: "tabular-nums",
              fontWeight: 600, color, fontSize: 12,
            }}>{mpFmt(pct)}</span>
            <span style={{
              fontFamily: SERIF_MP, fontStyle: "italic",
              color: "var(--ab-muted)", fontSize: 12,
            }}>{sec}</span>
            <span style={{
              fontFamily: SERIF_MP, fontWeight: 600, textAlign: "right",
            }}>{sym}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
      {/* Advancing */}
      <div>
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          marginBottom: 10, borderBottom: "2px solid var(--ab-up)", paddingBottom: 6,
        }}>
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
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "56px 1fr 72px 1fr",
          padding: "6px 0", borderBottom: "1px solid var(--ab-border)",
          fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase",
          color: "var(--ab-faint)", fontWeight: 700, columnGap: 10,
        }}>
          <span>Sym</span><span>Sector</span>
          <span style={{ textAlign: "right" }}>Δ%</span><span></span>
        </div>
        {up.map(([sec, sym, pct]) => (
          <Row key={sym} sec={sec} sym={sym} pct={pct} side="up" />
        ))}
      </div>

      {/* Declining */}
      <div>
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          marginBottom: 10, borderBottom: "2px solid var(--ab-down)", paddingBottom: 6,
        }}>
          <span style={{
            fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase",
            color: "var(--ab-faint)", fontWeight: 700,
          }}>today&apos;s worst</span>
          <span style={{ fontFamily: SERIF_MP, fontSize: 20, fontWeight: 600, textAlign: "right" }}>
            Declining{" "}
            <span style={{ color: "var(--ab-muted)", fontSize: 14, fontStyle: "italic", fontWeight: 400 }}>
              · {down.length}
            </span>{" "}↓
          </span>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "72px 1fr 56px",
          padding: "6px 0", borderBottom: "1px solid var(--ab-border)",
          fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase",
          color: "var(--ab-faint)", fontWeight: 700, columnGap: 10,
        }}>
          <span>Δ%</span><span style={{ textAlign: "right" }}>Sector</span>
          <span style={{ textAlign: "right" }}>Sym</span>
        </div>
        {down.map(([sec, sym, pct]) => (
          <Row key={sym} sec={sec} sym={sym} pct={pct} side="down" />
        ))}
      </div>
    </div>
  );
}

// ── Tab Toggle ────────────────────────────────────────────────────────────
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
                padding: "10px 18px 12px",
                fontFamily: SERIF_MP,
                fontSize: 16,
                fontWeight: active ? 600 : 500,
                color: active ? "var(--ab-fg)" : "var(--ab-muted)",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                borderBottom: active ? `2px solid ${ACCENT}` : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t.label}
              <span style={{
                fontFamily: SANS_MP, fontSize: 10,
                letterSpacing: ".12em", textTransform: "uppercase",
                color: "var(--ab-faint)", fontWeight: 600, marginLeft: 10,
              }}>{t.hint}</span>
            </button>
          );
        })}
      </div>
      {/* Keyboard shortcuts hint */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, paddingBottom: 8,
      }}>
        <span style={{
          fontFamily: SANS_MP, fontSize: 10, letterSpacing: ".12em",
          textTransform: "uppercase", color: "var(--ab-faint)", fontWeight: 600,
        }}>View</span>
        {["M", "T"].map(k => (
          <kbd key={k} style={{
            fontFamily: "var(--ab-mono)", fontSize: 10,
            border: "1px solid var(--ab-border)", padding: "2px 6px",
            borderRadius: 3, color: "var(--ab-muted)", background: "transparent",
          }}>{k}</kbd>
        ))}
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────
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
  // Convert tree → flat stocks + symbol→meta lookup
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

  // Dark mode detection
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Tab state
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

  // Headlines panel state
  const [selected, setSelected] = useState<(StockMeta & { symbol: string }) | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<{ summary: string; sentiment: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Lookup quota
  const [lookupsLeft, setLookupsLeft] = useState<number>(
    isPro ? Infinity : Math.max(0, maxLookups - lookupsUsed),
  );
  const [limitHit, setLimitHit] = useState(!isPro && lookupsUsed >= maxLookups);

  const loadNews = useCallback(async (symbol: string) => {
    setNewsLoading(true);
    setNewsError(null);
    setNews([]);
    try {
      const res = await fetch(`/api/news/ticker?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { articles?: NewsArticle[] };
      setNews(data.articles ?? []);
    } catch {
      setNewsError("Could not load headlines. Try again.");
    } finally {
      setNewsLoading(false);
    }
  }, []);

  const loadAiSummary = useCallback(async (
    symbol: string, changePct: number, price: number | null,
  ) => {
    setAiLoading(true);
    setAiSummary(null);
    try {
      const params = new URLSearchParams({ symbol });
      params.set("changePct", changePct.toFixed(4));
      if (price != null) params.set("price", price.toFixed(2));
      const res = await fetch(`/api/market/stock-summary?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { sentiment: string; summary: string };
      setAiSummary(data);
    } catch {
      setAiSummary(null);
    } finally {
      setAiLoading(false);
    }
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

  // Dynamic content based on view
  const title = view === "map"
    ? "The map, in one glance."
    : "Gainers and losers, at a glance.";
  const dek = view === "map"
    ? "Each tile is a stock. Area encodes market capitalization; tint encodes today's move. Tap any tile for headlines and the story behind it."
    : "A two-column ledger: advancers on the left, decliners on the right — sorted by the size of the move. Bars are visual; numbers are exact.";
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

      {/* ── Masthead (title/dek changes on tab swap) ── */}
      <LedgerMasthead
        eyebrow={`Cartography · ${timeStr}`}
        title={title}
        dek={dek}
      />

      {/* ── Byline ── */}
      <LedgerByline
        left={bylineLeft}
        right={
          <span style={{
            fontFamily: SANS_MP, fontSize: 11,
            color: "var(--ab-faint)", fontVariantNumeric: "tabular-nums",
          }}>
            {lookupsLabel}
          </span>
        }
      />

      {/* ── Legend + market status — one compact row ── */}
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
        {/* Market status */}
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
              background: marketStatus.color === "green"
                ? "#10B981" : marketStatus.color === "yellow"
                ? "#F59E0B" : "#EF4444",
            }} />
          </span>
          <span style={{
            fontFamily: SANS_MP, fontSize: 10, fontWeight: 600,
            color: "var(--ab-fg)", whiteSpace: "nowrap",
          }}>{marketStatus.label}</span>
          <span style={{ whiteSpace: "nowrap" }}>· {marketStatus.reason}</span>
        </div>
      </div>

      {/* ── Daily limit banner ── */}
      {limitHit && (
        <div style={{
          border: `2px solid ${ACCENT}`, background: "var(--ab-surface-hi)",
          padding: "24px 32px", textAlign: "center", marginBottom: 20,
        }}>
          <p style={{
            fontFamily: SERIF_MP, fontSize: 18, fontWeight: 600,
            color: "var(--ab-fg)", margin: 0,
          }}>Daily limit reached</p>
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

      {/* ── Headlines panel ── */}
      {!selected ? (
        <p style={{
          fontFamily: SERIF_MP, fontStyle: "italic",
          fontSize: 12, color: "var(--ab-muted)", marginBottom: 16,
        }}>
          Tap a tile to see headlines and why it&apos;s moving.
        </p>
      ) : (
        <div style={{
          border: "1px solid var(--ab-border)", background: "var(--ab-card)",
          padding: "20px 24px", minHeight: 140, marginBottom: 20,
        }}>
          {/* Stock header */}
          <div style={{
            display: "flex", flexWrap: "wrap",
            alignItems: "baseline", gap: "6px 12px", marginBottom: 12,
          }}>
            <span style={{
              fontFamily: SERIF_MP, fontSize: 20, fontWeight: 600,
              color: "var(--ab-fg)",
            }}>
              {selected.shortName ?? selected.symbol}
            </span>
            <span style={{
              fontFamily: SANS_MP, fontSize: 12,
              color: "var(--ab-muted)", fontVariantNumeric: "tabular-nums",
            }}>
              {selected.symbol}
            </span>
            {selected.price != null && (
              <span style={{
                fontFamily: SERIF_MP, fontSize: 15,
                fontWeight: 600, fontVariantNumeric: "tabular-nums",
              }}>
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

          {/* AI summary */}
          {aiLoading && (
            <p style={{
              fontFamily: SERIF_MP, fontStyle: "italic",
              fontSize: 13, color: "var(--ab-muted)",
            }}>Analysing move…</p>
          )}
          {!aiLoading && aiSummary?.summary && (
            <p style={{
              fontFamily: SERIF_MP, fontSize: 14, lineHeight: 1.6,
              color: "var(--ab-muted)", marginBottom: 14,
            }}>{aiSummary.summary}</p>
          )}

          {/* News headlines */}
          {newsLoading && (
            <p style={{
              fontFamily: SERIF_MP, fontStyle: "italic",
              fontSize: 13, color: "var(--ab-muted)",
            }}>Loading headlines…</p>
          )}
          {newsError && (
            <p style={{ fontFamily: SANS_MP, fontSize: 12, color: "var(--ab-down)" }}
               role="alert">{newsError}</p>
          )}
          {!newsLoading && news.length > 0 && (
            <div style={{ maxHeight: "min(52vh, 480px)", overflowY: "auto" }}>
              {news.slice(0, 6).map(a => (
                <div key={a.id} style={{
                  padding: "12px 0",
                  borderBottom: "1px solid var(--ab-border)",
                }}>
                  <p style={{
                    fontFamily: SERIF_MP, fontSize: 15, fontWeight: 600,
                    lineHeight: 1.25, color: "var(--ab-fg)", marginBottom: 4,
                    display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>{a.title}</p>
                  {a.summary && (
                    <p style={{
                      fontFamily: SERIF_MP, fontSize: 13,
                      color: "var(--ab-muted)", lineHeight: 1.55, marginBottom: 6,
                      display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>{a.summary}</p>
                  )}
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontFamily: SANS_MP, fontSize: 11, color: ACCENT,
                      letterSpacing: ".04em", textDecoration: "none",
                    }}
                  >Original article →</a>
                </div>
              ))}
            </div>
          )}
          {!newsLoading && !newsError && news.length === 0 && (
            <p style={{
              fontFamily: SERIF_MP, fontStyle: "italic",
              fontSize: 13, color: "var(--ab-muted)",
            }}>No headlines matched this symbol yet. Try again later.</p>
          )}
        </div>
      )}

      {/* ── Tab toggle ── */}
      <MP_Tabs view={view} setView={setView} />

      {/* ── Views ── */}
      {view === "map" && (
        <MP_TreemapView stocks={stocks} dark={dark} onTileClick={onTileClick} />
      )}
      {view === "table" && (
        <MP_TableView stocks={stocks} dark={dark} onTileClick={onTileClick} />
      )}

      {/* ── What the map is saying — 4-col kicker ── */}
      <LedgerRuleLabel>What the map is saying</LedgerRuleLabel>
      <div className="grid ab-kicker-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 32 }}>
        {[kicker.driver, kicker.green, kicker.drag, kicker.breadth].map(item => (
          <div key={item.label} style={{ borderTop: "1px solid var(--ab-border)", paddingTop: 12 }}>
            <div style={{
              fontFamily: SANS_MP, fontSize: 10, letterSpacing: ".22em",
              textTransform: "uppercase", color: "var(--ab-faint)",
              fontWeight: 700, marginBottom: 6,
            }}>{item.label}</div>
            <div style={{
              fontFamily: SERIF_MP, fontSize: 20,
              fontWeight: 600, lineHeight: 1.15,
            }}>{item.value}</div>
            {item.sub && (
              <div style={{
                fontFamily: SERIF_MP, fontStyle: "italic",
                fontSize: 13, color: "var(--ab-muted)", marginTop: 4,
              }}>{item.sub}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
