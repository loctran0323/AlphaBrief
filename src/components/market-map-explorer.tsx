"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  Tooltip,
  Treemap,
  type TreemapNode,
} from "recharts";
import {
  type MarketMapLeaf,
  type MarketMapRoot,
  type MarketMapSector,
  treemapIndustryLabel,
  treemapSectorLabel,
} from "@/lib/market-map-data";
import type { NewsArticle } from "@/types/news";
import { AutoRefresh } from "@/components/auto-refresh";

type LeafPayload = {
  name: string;
  symbol?: string;
  shortName?: string;
  changePct?: number;
  price?: number | null;
  size?: number;
  children?: unknown[];
};

function colorForChange(pct: number): string {
  if (pct >= 0) {
    const a = Math.min(0.35 + (Math.min(pct, 5) / 5) * 0.5, 0.92);
    return `rgba(34, 197, 94, ${a})`;
  }
  const a = Math.min(0.35 + (Math.min(Math.abs(pct), 5) / 5) * 0.5, 0.92);
  return `rgba(244, 63, 94, ${a})`;
}

const LABEL_FONT =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const labelStrokeProps = {
  paintOrder: "stroke" as const,
  stroke: "rgba(12, 15, 20, 0.65)",
  strokeWidth: 3,
  strokeLinejoin: "round" as const,
};

const sectorLabelStroke = {
  paintOrder: "stroke" as const,
  stroke: "rgba(4, 6, 10, 0.92)",
  strokeWidth: 4,
  strokeLinejoin: "round" as const,
};


/**
 * Recharts nests `data={[tree]}` under a synthetic root, so depths are:
 * 0 wrapper → 1 "US large caps" → 2 sector (Technology, Financials, …) → 3 industry → 4 stock.
 */
function rectAttrs(depth: number, isLeaf: boolean, pct: number) {
  if (isLeaf) {
    return {
      fill: colorForChange(pct),
      stroke: "#030508",
      strokeWidth: 1.1,
    } as const;
  }
  if (depth === 0) {
    return {
      fill: "rgba(6, 9, 14, 0.35)",
      stroke: "rgba(255, 255, 255, 0.14)",
      strokeWidth: 2,
    } as const;
  }
  if (depth === 1) {
    return {
      fill: "rgba(12, 17, 28, 0.5)",
      stroke: "rgba(255, 255, 255, 0.22)",
      strokeWidth: 3,
    } as const;
  }
  if (depth === 2) {
    return {
      fill: "rgba(32, 44, 72, 0.96)",
      stroke: "rgba(241, 245, 249, 0.62)",
      strokeWidth: 5,
    } as const;
  }
  if (depth === 3) {
    return {
      fill: "rgba(22, 32, 52, 0.96)",
      stroke: "rgba(186, 205, 224, 0.58)",
      strokeWidth: 3.5,
    } as const;
  }
  return {
    fill: "rgba(16, 24, 40, 0.94)",
    stroke: "rgba(148, 163, 184, 0.4)",
    strokeWidth: 2,
  } as const;
}

function fitSvgLine(text: string, maxWidth: number, charPx = 7): string {
  const budget = Math.max(3, Math.floor((maxWidth - 14) / charPx));
  if (text.length <= budget) return text;
  return `${text.slice(0, Math.max(2, budget - 1))}…`;
}

/** Shrink font until label fits (no ellipsis on sector/industry names). */
function fontSizeToFitLabel(
  text: string,
  maxInnerW: number,
  maxInnerH: number,
  maxFs: number,
  minFs: number,
): number {
  for (let fs = Math.floor(maxFs * 2) / 2; fs >= minFs; fs -= 0.5) {
    const estW = text.length * fs * 0.52 + 14;
    if (estW <= maxInnerW && fs + 8 <= maxInnerH) return fs;
  }
  return minFs;
}

function IndustryLabelChip({
  x,
  y,
  width,
  height,
  text,
  fontSize,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
}) {
  const padX = 6;
  const padY = 4;
  const innerW = Math.max(0, width - padX * 2);
  const innerH = Math.max(0, height - padY * 2);
  const fs = fontSizeToFitLabel(text, innerW - 14, innerH - 4, fontSize, 7);
  const chipH = Math.min(innerH, Math.max(fs + 8, 18));
  const estChipW = Math.min(innerW, Math.max(28, text.length * fs * 0.52 + 14));
  const chipW = estChipW;
  const chipX = x + padX;
  const chipY = y + padY;
  const ty = chipY + chipH / 2;
  return (
    <g>
      <rect
        x={chipX}
        y={chipY}
        width={chipW}
        height={chipH}
        rx={4}
        fill="rgba(248, 250, 252, 0.96)"
        stroke="rgba(15, 23, 42, 0.28)"
        strokeWidth={1}
      />
      <text
        x={chipX + 7}
        y={ty}
        textAnchor="start"
        dominantBaseline="middle"
        fill="#0f172a"
        fontSize={fs}
        fontWeight={700}
        letterSpacing="0.01em"
        style={{ fontFamily: LABEL_FONT }}
      >
        {text}
      </text>
    </g>
  );
}

function MapRect(props: TreemapNode & LeafPayload) {
  const clipId = useId().replace(/:/g, "");
  const { x, y, width, height, name, depth } = props;
  const node = props;
  const pct = typeof node.changePct === "number" ? node.changePct : 0;
  const isLeaf = typeof node.symbol === "string" && node.symbol.length > 0;
  const { fill, stroke, strokeWidth } = rectAttrs(depth, isLeaf, pct);

  const innerPad = 2;
  const clipW = Math.max(0, width - innerPad * 2);
  const clipH = Math.max(0, height - innerPad * 2);

  const showLeaf = width > 32 && height > 17;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const symFont = Math.min(17, Math.max(9, Math.min(width / 5, height / 2.9)));
  const pctFont = Math.max(9, Math.min(symFont - 2, height * 0.24));
  const pctText = `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
  const twoLineOk =
    width >= 46 &&
    height >= 52 &&
    symFont * 0.9 + pctFont * 0.9 + 10 < height &&
    width / symFont > 2.2;

  const sectorShort = name && depth === 2 ? treemapSectorLabel(name).toUpperCase() : "";
  const industryShort = name && depth === 3 ? treemapIndustryLabel(name) : "";

  const sectorBannerFs =
    sectorShort.length > 0
      ? Math.min(15, Math.max(7.5, Math.min(width / Math.max(sectorShort.length * 0.52, 2.5), height / 4.8)))
      : Math.min(15, Math.max(9, Math.min(width / 10, height / 5)));
  const industryBannerFs = Math.min(13, Math.max(8, Math.min(width / 8, height / 4.5)));
  const rootBannerFs = Math.min(12, Math.max(9, width / 22));

  const sectorLine = sectorShort;
  const industryLine = industryShort;
  const compactLeafLine = name
    ? fitSvgLine(`${name} ${pctText}`, width - 10, Math.max(5.2, Math.min(6.8, width / 14)))
    : "";

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x + innerPad} y={y + innerPad} width={clipW} height={clipH} />
        </clipPath>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        style={{ cursor: isLeaf ? "pointer" : "default" }}
      />
      <g clipPath={`url(#${clipId})`}>
        {showLeaf && isLeaf && (
          <>
            {twoLineOk ? (
              <>
                <text
                  x={cx}
                  y={cy - symFont * 0.42}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fafafa"
                  fontSize={symFont}
                  fontWeight={700}
                  style={{ fontFamily: LABEL_FONT }}
                  {...labelStrokeProps}
                >
                  {fitSvgLine(name, width - 10, Math.max(5.5, symFont * 0.42))}
                </text>
                <text
                  x={cx}
                  y={cy + symFont * 0.52}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#f1f5f9"
                  fontSize={pctFont}
                  fontWeight={700}
                  style={{ fontFamily: LABEL_FONT }}
                  {...labelStrokeProps}
                >
                  {pctText}
                </text>
              </>
            ) : (
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fafafa"
                fontSize={Math.min(symFont, 12)}
                fontWeight={700}
                style={{ fontFamily: LABEL_FONT }}
                {...labelStrokeProps}
              >
                {compactLeafLine}
              </text>
            )}
          </>
        )}
        {!isLeaf && depth === 2 && sectorLine && width > 28 && height > 11 && (
          <text
            x={x + 6}
            y={y + Math.min(Math.max(sectorBannerFs * 0.55, 11), height * 0.42)}
            textAnchor="start"
            dominantBaseline="middle"
            fill="#e8edf5"
            fontSize={sectorBannerFs}
            fontWeight={800}
            letterSpacing="0.05em"
            style={{ fontFamily: LABEL_FONT }}
            {...sectorLabelStroke}
          >
            {sectorLine}
          </text>
        )}
        {!isLeaf && depth === 3 && industryLine && width > 26 && height > 10 && (
          <IndustryLabelChip
            x={x}
            y={y}
            width={width}
            height={height}
            text={industryLine}
            fontSize={industryBannerFs}
          />
        )}
        {!isLeaf && depth === 1 && name && width > 88 && height > 22 && (
          <text
            x={x + 8}
            y={y + 13}
            textAnchor="start"
            dominantBaseline="middle"
            fill="rgba(248, 250, 252, 0.4)"
            fontSize={rootBannerFs}
            fontWeight={600}
            letterSpacing="0.04em"
            style={{ fontFamily: LABEL_FONT }}
            {...labelStrokeProps}
          >
            LARGE CAPS
          </text>
        )}
      </g>
    </g>
  );
}

function MapTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: LeafPayload }[];
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const p = payload[0].payload;
  if (!p.symbol) {
    return (
      <div className="max-w-xs rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--foreground)] shadow-lg">
        <span className="font-semibold text-white">{p.name}</span>
        <p className="mt-1 text-[var(--muted)]">Sector or industry group</p>
      </div>
    );
  }
  return (
    <div className="max-w-xs rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--foreground)] shadow-lg">
      <div className="font-semibold text-white">{p.shortName ?? p.symbol}</div>
      <div className="text-[var(--muted)]">{p.symbol}</div>
      <div className="mt-1 font-medium">
        {typeof p.changePct === "number" ? (
          <>
            {p.changePct >= 0 ? "+" : ""}
            {p.changePct.toFixed(2)}%
          </>
        ) : (
          "—"
        )}
      </div>
      {p.price != null && (
        <div className="text-[var(--muted)]">Last: ${p.price.toFixed(2)}</div>
      )}
      <div className="mt-1 text-[var(--muted)]">Click for headlines</div>
    </div>
  );
}

/** Zoom range on top of a taller default canvas (~ old “235%” feel at 100%). */
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.6;
const ZOOM_STEP = 0.1;
const BASE_CHART_PX = Math.round(560 * 2.35);

function MapViewToolbar({
  zoom,
  onZoomOut,
  onZoomIn,
  onResetZoom,
  isFullscreen,
  onToggleFullscreen,
}: {
  zoom: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onResetZoom: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        Map view
      </span>
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 p-0.5">
        <button
          type="button"
          aria-label="Zoom out"
          onClick={onZoomOut}
          className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
          disabled={zoom <= ZOOM_MIN + 0.01}
        >
          −
        </button>
        <span className="min-w-[3rem] text-center font-mono text-xs text-[var(--foreground)]">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={onZoomIn}
          className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
          disabled={zoom >= ZOOM_MAX - 0.01}
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={onResetZoom}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:border-white/20 hover:text-white"
      >
        Reset
      </button>
      <button
        type="button"
        onClick={onToggleFullscreen}
        className="ml-auto rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-muted)]"
      >
        {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      </button>
    </div>
  );
}

export function MarketMapExplorer({ tree }: { tree: MarketMapRoot }) {
  const leafByTicker = useMemo(() => {
    const m = new Map<string, MarketMapLeaf>();
    for (const sector of tree.children as MarketMapSector[]) {
      for (const industry of sector.children) {
        for (const leaf of industry.children) {
          m.set(leaf.symbol.toUpperCase(), leaf);
          m.set(leaf.name.toUpperCase(), leaf);
        }
      }
    }
    return m;
  }, [tree]);

  const [selected, setSelected] = useState<LeafPayload | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapShellRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => {
      const el = mapShellRef.current;
      const active =
        document.fullscreenElement === el ||
        (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ===
          el;
      setIsFullscreen(Boolean(el && active));
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
    } catch {
      /* ignore */
    }
  }, []);

  const onZoomOut = useCallback(() => {
    setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100));
  }, []);
  const onZoomIn = useCallback(() => {
    setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100));
  }, []);
  const onResetZoom = useCallback(() => setZoom(1), []);

  const chartHeight = Math.round(BASE_CHART_PX * zoom);

  const loadNews = useCallback(async (symbol: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news/ticker?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error("Failed to load news");
      const data = (await res.json()) as { articles?: NewsArticle[] };
      setNews(data.articles ?? []);
    } catch {
      setError("Could not load headlines. Try again.");
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onTreemapClick = useCallback(
    (node: TreemapNode) => {
      const n = node as TreemapNode & LeafPayload;
      const fromNode =
        typeof n.symbol === "string" && n.symbol.trim()
          ? n.symbol.trim().toUpperCase()
          : "";
      const fromName = typeof n.name === "string" ? n.name.trim().toUpperCase() : "";
      const hit = (fromNode && leafByTicker.get(fromNode)) || leafByTicker.get(fromName);
      if (!hit) return;
      setSelected({ ...hit, symbol: hit.symbol });
      void loadNews(hit.symbol);
    },
    [leafByTicker, loadNews],
  );

  const moveColor =
    selected && typeof selected.changePct === "number"
      ? selected.changePct >= 0
        ? "text-emerald-300"
        : "text-rose-300"
      : "text-[var(--muted)]";

  const embedScrollMax = "min(92vh, 1680px)";

  return (
    <div className="space-y-6">
      <AutoRefresh everyMs={900000} />

      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--faint)]">Map</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Market map</h1>
      </header>

      <div className="space-y-3">
        {!selected?.symbol ? (
          <p className="max-w-full text-sm text-[var(--muted)]">
            Click a stock in the map to see headlines and an AI-style read on why it might be moving.
          </p>
        ) : (
          <div className="min-h-[140px] max-w-full">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-xl font-semibold text-white">
                {selected.shortName ?? selected.symbol}
              </h2>
              <span className="font-mono text-sm text-[var(--muted)]">{selected.symbol}</span>
              <span className="text-sm text-[var(--muted)]">
                {selected.price != null ? (
                  <span className="font-medium text-white">${selected.price.toFixed(2)}</span>
                ) : (
                  <span>—</span>
                )}
              </span>
              <span className={`text-sm font-semibold ${moveColor}`}>
                {typeof selected.changePct === "number" ? (
                  <>
                    {selected.changePct >= 0 ? "+" : ""}
                    {selected.changePct.toFixed(2)}%
                  </>
                ) : (
                  "—"
                )}
                <span className="ml-1 text-xs font-normal text-[var(--muted)]">vs prior close</span>
              </span>
            </div>
            {loading && (
              <p className="mt-3 text-sm text-[var(--muted)]">Loading headlines…</p>
            )}
            {error && (
              <p className="mt-3 text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
            {!loading && news.length > 0 && (
              <ul className="mt-4 max-h-[min(52vh,480px)] space-y-3 overflow-y-auto overflow-x-hidden pr-1">
                {news.slice(0, 6).map((a) => (
                  <li
                    key={a.id}
                    className="min-w-0 max-w-full rounded-lg border border-white/10 bg-white/[0.03] p-3"
                  >
                    <p className="line-clamp-2 break-words text-sm font-medium text-white">
                      {a.title}
                    </p>
                    <p className="mt-2 line-clamp-3 break-words text-sm leading-relaxed text-[var(--muted)]">
                      {a.summary}
                    </p>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-xs font-medium text-[var(--accent)] hover:underline"
                    >
                      Original article →
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {!loading && !error && news.length === 0 && (
              <p className="mt-3 text-sm text-[var(--muted)]">
                No headlines matched this symbol yet. Try again later.
              </p>
            )}
          </div>
        )}

        <div
          ref={mapShellRef}
          className={
            isFullscreen
              ? "flex h-screen max-h-[100dvh] min-h-0 w-full flex-col bg-[var(--background)] p-4"
              : "flex flex-col rounded-xl border border-white/15 bg-[var(--background)]/90 p-3"
          }
        >
          <MapViewToolbar
            zoom={zoom}
            onZoomOut={onZoomOut}
            onZoomIn={onZoomIn}
            onResetZoom={onResetZoom}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
          />
          <div
            className={`min-h-0 w-full overflow-auto ${isFullscreen ? "mt-3 min-h-0 flex-1" : "mt-3"}`}
            style={isFullscreen ? undefined : { maxHeight: embedScrollMax }}
          >
            <div className="w-full" style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <Treemap
                  data={[tree]}
                  dataKey="size"
                  nameKey="name"
                  aspectRatio={1.22}
                  isAnimationActive={false}
                  content={(props: TreemapNode) => <MapRect {...(props as TreemapNode & LeafPayload)} />}
                  onClick={onTreemapClick}
                >
                  <Tooltip content={<MapTooltip />} />
                </Treemap>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
