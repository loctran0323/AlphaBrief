import crypto from "node:crypto";
import type { MarketEvent } from "@/types/database";
import { startOfEtDay, wallTimeEtToUtc } from "@/lib/date-utils";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Upcoming synthetic macro: next ~30 days, tier-1 releases only (no housing filler). */
export const SYNTHETIC_MACRO_HORIZON_DAYS = 30;
/** Max tier-1 rows shown; real count is often smaller if fewer land in the window. */
export const SYNTHETIC_MACRO_MAX = 8;

type MacroRow = {
  y: number;
  mo: number;
  d: number;
  h: number;
  min: number;
  title: string;
  why_it_matters: string;
  watch_for: string;
};

/**
 * Approximate US macro calendar in Eastern Time (release windows vary; FOMC uses Fed-published meeting dates).
 * 8:30 = typical BLS/Census; 9:00 = Case-Shiller; 10:00 = NAHB/ISM; 14:00 = FOMC statement (meeting day 2).
 */
const MACRO_SCHEDULE: MacroRow[] = [
  {
    y: 2026,
    mo: 1,
    d: 14,
    h: 8,
    min: 30,
    title: "CPI (headline)",
    why_it_matters:
      "Inflation path drives Fed expectations, real yields, and style rotation (growth vs. value).",
    watch_for: "Core vs. headline, shelter, services, and revisions.",
  },
  {
    y: 2026,
    mo: 1,
    d: 28,
    h: 14,
    min: 0,
    title: "FOMC rate decision",
    why_it_matters:
      "Policy path reprices equities, USD, and credit spreads in hours.",
    watch_for: "Statement tone, dot plot, and press conference guidance.",
  },
  {
    y: 2026,
    mo: 2,
    d: 12,
    h: 8,
    min: 30,
    title: "CPI (headline)",
    why_it_matters:
      "Inflation path drives Fed expectations, real yields, and style rotation (growth vs. value).",
    watch_for: "Core vs. headline, shelter, services, and revisions.",
  },
  {
    y: 2026,
    mo: 3,
    d: 12,
    h: 8,
    min: 30,
    title: "CPI (headline)",
    why_it_matters:
      "Inflation path drives Fed expectations, real yields, and style rotation (growth vs. value).",
    watch_for: "Core vs. headline, shelter, services, and revisions.",
  },
  {
    y: 2026,
    mo: 3,
    d: 18,
    h: 14,
    min: 0,
    title: "FOMC rate decision",
    why_it_matters:
      "Policy path reprices equities, USD, and credit spreads in hours.",
    watch_for: "Statement tone, dot plot, and press conference guidance.",
  },
  {
    y: 2026,
    mo: 4,
    d: 3,
    h: 8,
    min: 30,
    title: "Nonfarm payrolls",
    why_it_matters:
      "Labor market strength feeds Fed reaction function and cyclical equity leadership.",
    watch_for: "Revisions, participation, wages, and household vs. establishment signals.",
  },
  {
    y: 2026,
    mo: 4,
    d: 14,
    h: 8,
    min: 30,
    title: "CPI (headline)",
    why_it_matters:
      "Inflation path drives Fed expectations, real yields, and style rotation (growth vs. value).",
    watch_for: "Core vs. headline, shelter, services, and revisions.",
  },
  {
    y: 2026,
    mo: 4,
    d: 16,
    h: 8,
    min: 30,
    title: "Building permits & housing starts",
    why_it_matters:
      "Residential construction pipeline feeds GDP expectations and rate-sensitive sectors (builders, materials, banks).",
    watch_for: "Single vs. multi-family mix, revisions to prior month, and regional strength.",
  },
  {
    y: 2026,
    mo: 4,
    d: 22,
    h: 10,
    min: 0,
    title: "Existing home sales",
    why_it_matters:
      "Largest housing volume; liquidity in resale market affects consumer spending and rates narrative.",
    watch_for: "Sales pace vs. expectations, days on market, and price trends.",
  },
  {
    y: 2026,
    mo: 4,
    d: 23,
    h: 10,
    min: 0,
    title: "New home sales",
    why_it_matters:
      "Forward-looking demand for new builds; moves homebuilder and mortgage sentiment.",
    watch_for: "Median price, inventory months-supply, and regional sales mix.",
  },
  {
    y: 2026,
    mo: 4,
    d: 28,
    h: 9,
    min: 0,
    title: "Case-Shiller home price index",
    why_it_matters:
      "Home prices shape wealth effects, shelter inflation debates, and consumer confidence.",
    watch_for: "20-city vs. national, year-over-year pace, and divergence across metros.",
  },
  {
    y: 2026,
    mo: 4,
    d: 29,
    h: 14,
    min: 0,
    title: "FOMC rate decision",
    why_it_matters:
      "Policy path reprices equities, USD, and credit spreads in hours.",
    watch_for: "Statement tone, dot plot, and press conference guidance.",
  },
  {
    y: 2026,
    mo: 4,
    d: 30,
    h: 8,
    min: 30,
    title: "GDP (advance)",
    why_it_matters:
      "Growth surprise moves rates and cyclical vs. defensive sector performance.",
    watch_for: "Consumption vs. investment mix, inventories, and net exports.",
  },
  {
    y: 2026,
    mo: 5,
    d: 1,
    h: 8,
    min: 30,
    title: "PCE price index",
    why_it_matters:
      "Fed’s preferred inflation gauge; shifts rate-cut/pricing for risk assets.",
    watch_for: "Core PCE, supercore services, and month-over-month momentum.",
  },
  {
    y: 2026,
    mo: 5,
    d: 8,
    h: 8,
    min: 30,
    title: "Nonfarm payrolls",
    why_it_matters:
      "Labor market strength feeds Fed reaction function and cyclical equity leadership.",
    watch_for: "Revisions, participation, wages, and household vs. establishment signals.",
  },
  {
    y: 2026,
    mo: 5,
    d: 13,
    h: 8,
    min: 30,
    title: "CPI (headline)",
    why_it_matters:
      "Inflation path drives Fed expectations, real yields, and style rotation (growth vs. value).",
    watch_for: "Core vs. headline, shelter, services, and revisions.",
  },
  {
    y: 2026,
    mo: 5,
    d: 15,
    h: 8,
    min: 30,
    title: "Retail sales",
    why_it_matters:
      "Consumer demand pulse for discretionary names and GDP nowcasts.",
    watch_for: "Control group, autos/gasoline strip, and e-commerce share.",
  },
  {
    y: 2026,
    mo: 5,
    d: 18,
    h: 10,
    min: 0,
    title: "NAHB housing market index",
    why_it_matters:
      "Builder confidence is an early read on permits, starts, and employment in construction.",
    watch_for: "Present sales vs. expectations components; regional diffusion.",
  },
  {
    y: 2026,
    mo: 5,
    d: 26,
    h: 9,
    min: 0,
    title: "Case-Shiller home price index",
    why_it_matters:
      "Home prices shape wealth effects, shelter inflation debates, and consumer confidence.",
    watch_for: "20-city vs. national, year-over-year pace, and divergence across metros.",
  },
  {
    y: 2026,
    mo: 5,
    d: 29,
    h: 8,
    min: 30,
    title: "PCE price index",
    why_it_matters:
      "Fed’s preferred inflation gauge; shifts rate-cut/pricing for risk assets.",
    watch_for: "Core PCE, supercore services, and month-over-month momentum.",
  },
  {
    y: 2026,
    mo: 6,
    d: 5,
    h: 8,
    min: 30,
    title: "Nonfarm payrolls",
    why_it_matters:
      "Labor market strength feeds Fed reaction function and cyclical equity leadership.",
    watch_for: "Revisions, participation, wages, and household vs. establishment signals.",
  },
  {
    y: 2026,
    mo: 6,
    d: 11,
    h: 8,
    min: 30,
    title: "CPI (headline)",
    why_it_matters:
      "Inflation path drives Fed expectations, real yields, and style rotation (growth vs. value).",
    watch_for: "Core vs. headline, shelter, services, and revisions.",
  },
  {
    y: 2026,
    mo: 6,
    d: 17,
    h: 14,
    min: 0,
    title: "FOMC rate decision",
    why_it_matters:
      "Policy path reprices equities, USD, and credit spreads in hours.",
    watch_for: "Statement tone, dot plot, and press conference guidance.",
  },
  {
    y: 2026,
    mo: 6,
    d: 26,
    h: 8,
    min: 30,
    title: "PCE price index",
    why_it_matters:
      "Fed’s preferred inflation gauge; shifts rate-cut/pricing for risk assets.",
    watch_for: "Core PCE, supercore services, and month-over-month momentum.",
  },
  {
    y: 2026,
    mo: 7,
    d: 2,
    h: 10,
    min: 0,
    title: "ISM manufacturing PMI",
    why_it_matters:
      "Factory orders and employment subindexes hint at industrial cycle and capex.",
    watch_for: "New orders vs. inventories, prices paid, and export orders.",
  },
  {
    y: 2026,
    mo: 7,
    d: 3,
    h: 8,
    min: 30,
    title: "Nonfarm payrolls",
    why_it_matters:
      "Labor market strength feeds Fed reaction function and cyclical equity leadership.",
    watch_for: "Revisions, participation, wages, and household vs. establishment signals.",
  },
  {
    y: 2026,
    mo: 7,
    d: 15,
    h: 8,
    min: 30,
    title: "CPI (headline)",
    why_it_matters:
      "Inflation path drives Fed expectations, real yields, and style rotation (growth vs. value).",
    watch_for: "Core vs. headline, shelter, services, and revisions.",
  },
  {
    y: 2026,
    mo: 7,
    d: 29,
    h: 14,
    min: 0,
    title: "FOMC rate decision",
    why_it_matters:
      "Policy path reprices equities, USD, and credit spreads in hours.",
    watch_for: "Statement tone, dot plot, and press conference guidance.",
  },
  {
    y: 2026,
    mo: 8,
    d: 1,
    h: 10,
    min: 30,
    title: "UMich consumer sentiment",
    why_it_matters:
      "Expectations channel for spending; inflation expectations feed rates narrative.",
    watch_for: "Current conditions vs. expectations, and 5–10y inflation expectations.",
  },
  {
    y: 2026,
    mo: 8,
    d: 7,
    h: 8,
    min: 30,
    title: "Nonfarm payrolls",
    why_it_matters:
      "Labor market strength feeds Fed reaction function and cyclical equity leadership.",
    watch_for: "Revisions, participation, wages, and household vs. establishment signals.",
  },
  {
    y: 2026,
    mo: 8,
    d: 12,
    h: 8,
    min: 30,
    title: "CPI (headline)",
    why_it_matters:
      "Inflation path drives Fed expectations, real yields, and style rotation (growth vs. value).",
    watch_for: "Core vs. headline, shelter, services, and revisions.",
  },
  {
    y: 2026,
    mo: 8,
    d: 26,
    h: 8,
    min: 30,
    title: "Durable goods orders",
    why_it_matters:
      "Capex proxy for manufacturing and transport; volatility from aircraft line items.",
    watch_for: "Ex-transportation core, nondefense cap ex, and prior-month revisions.",
  },
  {
    y: 2026,
    mo: 9,
    d: 4,
    h: 8,
    min: 30,
    title: "Nonfarm payrolls",
    why_it_matters:
      "Labor market strength feeds Fed reaction function and cyclical equity leadership.",
    watch_for: "Revisions, participation, wages, and household vs. establishment signals.",
  },
  {
    y: 2026,
    mo: 9,
    d: 11,
    h: 8,
    min: 30,
    title: "CPI (headline)",
    why_it_matters:
      "Inflation path drives Fed expectations, real yields, and style rotation (growth vs. value).",
    watch_for: "Core vs. headline, shelter, services, and revisions.",
  },
  {
    y: 2026,
    mo: 9,
    d: 16,
    h: 14,
    min: 0,
    title: "FOMC rate decision",
    why_it_matters:
      "Policy path reprices equities, USD, and credit spreads in hours.",
    watch_for: "Statement tone, dot plot, and press conference guidance.",
  },
  {
    y: 2026,
    mo: 9,
    d: 24,
    h: 8,
    min: 15,
    title: "EIA crude oil inventories",
    why_it_matters:
      "Weekly balances move energy equities and inflation expectations tied to fuel costs.",
    watch_for: "Gasoline/distillate builds, SPR commentary, and implied demand.",
  },
  {
    y: 2026,
    mo: 10,
    d: 2,
    h: 8,
    min: 30,
    title: "Nonfarm payrolls",
    why_it_matters:
      "Labor market strength feeds Fed reaction function and cyclical equity leadership.",
    watch_for: "Revisions, participation, wages, and household vs. establishment signals.",
  },
  {
    y: 2026,
    mo: 10,
    d: 14,
    h: 8,
    min: 30,
    title: "CPI (headline)",
    why_it_matters:
      "Inflation path drives Fed expectations, real yields, and style rotation (growth vs. value).",
    watch_for: "Core vs. headline, shelter, services, and revisions.",
  },
  {
    y: 2026,
    mo: 10,
    d: 28,
    h: 14,
    min: 0,
    title: "FOMC rate decision",
    why_it_matters:
      "Policy path reprices equities, USD, and credit spreads in hours.",
    watch_for: "Statement tone, dot plot, and press conference guidance.",
  },
  {
    y: 2026,
    mo: 11,
    d: 6,
    h: 8,
    min: 30,
    title: "Nonfarm payrolls",
    why_it_matters:
      "Labor market strength feeds Fed reaction function and cyclical equity leadership.",
    watch_for: "Revisions, participation, wages, and household vs. establishment signals.",
  },
  {
    y: 2026,
    mo: 11,
    d: 12,
    h: 8,
    min: 30,
    title: "CPI (headline)",
    why_it_matters:
      "Inflation path drives Fed expectations, real yields, and style rotation (growth vs. value).",
    watch_for: "Core vs. headline, shelter, services, and revisions.",
  },
  {
    y: 2026,
    mo: 12,
    d: 4,
    h: 8,
    min: 30,
    title: "Nonfarm payrolls",
    why_it_matters:
      "Labor market strength feeds Fed reaction function and cyclical equity leadership.",
    watch_for: "Revisions, participation, wages, and household vs. establishment signals.",
  },
  {
    y: 2026,
    mo: 12,
    d: 9,
    h: 14,
    min: 0,
    title: "FOMC rate decision",
    why_it_matters:
      "Policy path reprices equities, USD, and credit spreads in hours.",
    watch_for: "Statement tone, dot plot, and press conference guidance.",
  },
  {
    y: 2026,
    mo: 12,
    d: 11,
    h: 8,
    min: 30,
    title: "CPI (headline)",
    why_it_matters:
      "Inflation path drives Fed expectations, real yields, and style rotation (growth vs. value).",
    watch_for: "Core vs. headline, shelter, services, and revisions.",
  },
  {
    y: 2027,
    mo: 1,
    d: 13,
    h: 8,
    min: 30,
    title: "CPI (headline)",
    why_it_matters:
      "Inflation path drives Fed expectations, real yields, and style rotation (growth vs. value).",
    watch_for: "Core vs. headline, shelter, services, and revisions.",
  },
  {
    y: 2027,
    mo: 1,
    d: 28,
    h: 14,
    min: 0,
    title: "FOMC rate decision",
    why_it_matters:
      "Policy path reprices equities, USD, and credit spreads in hours.",
    watch_for: "Statement tone, dot plot, and press conference guidance.",
  },
];

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function rowToEvent(row: MacroRow, now: Date, idPrefix: string): MarketEvent {
  const eventDate = wallTimeEtToUtc(row.y, row.mo, row.d, row.h, row.min);
  const day = eventDate.toISOString().slice(0, 10);
  const id = crypto
    .createHash("sha1")
    .update(`${idPrefix}-${slug(row.title)}-${day}-${eventDate.getTime()}`)
    .digest("hex")
    .slice(0, 32);
  return {
    id: `syn-${id}`,
    ticker: null,
    title: row.title,
    event_type: "macro" as const,
    event_date: eventDate.toISOString(),
    why_it_matters: row.why_it_matters,
    watch_for: row.watch_for,
    created_at: now.toISOString(),
  };
}

/**
 * High-signal US macro only: policy, inflation, labor, Fed’s preferred PCE, consumer demand,
 * growth print, factory cycle, sentiment. Order = rough market attention, not release date.
 */
const MACRO_TITLE_PRIORITY: string[] = [
  "fomc rate decision",
  "cpi (headline)",
  "nonfarm payrolls",
  "pce price index",
  "retail sales",
  "gdp (advance)",
  "ism manufacturing pmi",
  "umich consumer sentiment",
];

export function getSyntheticMacroTimeline(now = new Date()): MarketEvent[] {
  const startToday = startOfEtDay(now).getTime();
  const horizonEnd = startToday + SYNTHETIC_MACRO_HORIZON_DAYS * DAY_MS;

  const nextByTitle = new Map<string, MacroRow>();
  for (const row of MACRO_SCHEDULE) {
    const t = wallTimeEtToUtc(row.y, row.mo, row.d, row.h, row.min).getTime();
    if (t < startToday || t > horizonEnd) continue;
    const k = row.title.toLowerCase().trim();
    if (!nextByTitle.has(k)) nextByTitle.set(k, row);
  }

  const picked: MacroRow[] = [];
  for (const p of MACRO_TITLE_PRIORITY) {
    if (picked.length >= SYNTHETIC_MACRO_MAX) break;
    const row = nextByTitle.get(p);
    if (row) picked.push(row);
  }

  return picked
    .sort(
      (a, b) =>
        wallTimeEtToUtc(a.y, a.mo, a.d, a.h, a.min).getTime() -
        wallTimeEtToUtc(b.y, b.mo, b.d, b.h, b.min).getTime(),
    )
    .map((row) => rowToEvent(row, now, "macro"));
}

export function getSyntheticMacroTimelinePast(now = new Date(), maxDaysBack = 40): MarketEvent[] {
  const nowMs = now.getTime();
  const minMs = nowMs - maxDaysBack * 24 * 60 * 60 * 1000;
  const out: MarketEvent[] = [];
  for (const row of MACRO_SCHEDULE) {
    const eventDate = wallTimeEtToUtc(row.y, row.mo, row.d, row.h, row.min);
    const t = eventDate.getTime();
    if (t >= nowMs || t < minMs) continue;
    out.push(rowToEvent(row, now, "macro-past"));
  }
  return out.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
}

function macroTitleKey(e: MarketEvent): string | null {
  if (e.ticker?.trim()) return null;
  return e.title.toLowerCase().trim();
}

/**
 * DB seed rows often duplicate the app macro calendar. If `incoming` carries a macro title we already
 * schedule synthetically, drop the DB copy so dates stay single-source.
 */
export function mergeTimelineEvents(
  dbEvents: MarketEvent[],
  incoming: MarketEvent[],
): MarketEvent[] {
  const incomingMacroTitles = new Set<string>();
  for (const e of incoming) {
    const k = macroTitleKey(e);
    if (k) incomingMacroTitles.add(k);
  }

  const filteredDb = dbEvents.filter((e) => {
    const k = macroTitleKey(e);
    if (!k) return true;
    return !incomingMacroTitles.has(k);
  });

  const byKey = new Map<string, MarketEvent>();
  const keyOf = (e: MarketEvent) =>
    `${e.title.toLowerCase().slice(0, 80)}|${e.event_date.slice(0, 16)}`;

  for (const e of filteredDb) {
    byKey.set(keyOf(e), e);
  }
  for (const e of incoming) {
    if (!byKey.has(keyOf(e))) {
      byKey.set(keyOf(e), e);
    }
  }

  return [...byKey.values()].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
  );
}
