import { MarketMapExplorer } from "@/components/market-map-explorer";
import { LedgerMasthead, LedgerByline, LedgerRuleLabel } from "@/components/ledger-ui";
import { fetchMarketMapTree } from "@/lib/market-map-data";
import { createClient } from "@/lib/supabase/server";
import { getUserTier, getMapLookupsToday, FREE_MAP_LOOKUPS_PER_DAY } from "@/lib/subscription";
import type { MarketMapSector } from "@/lib/market-map-data";

export const dynamic = "force-dynamic";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;

/** Derive "What the map is saying" kicker stats from tree data. */
function deriveMapKicker(tree: Awaited<ReturnType<typeof fetchMarketMapTree>>) {
  type Leaf = { symbol: string; changePct?: number; shortName?: string };
  const leaves: Leaf[] = [];
  for (const sector of tree.children as MarketMapSector[]) {
    for (const industry of sector.children) {
      for (const leaf of industry.children) {
        leaves.push(leaf);
      }
    }
  }

  const green  = leaves.filter(l => (l.changePct ?? 0) >= 0);
  const red    = leaves.filter(l => (l.changePct ?? 0) < 0);
  const sorted = [...leaves].sort((a, b) => Math.abs(b.changePct ?? 0) - Math.abs(a.changePct ?? 0));
  const topGain = [...leaves].sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))[0];
  const topLoss = [...leaves].sort((a, b) => (a.changePct ?? 0) - (b.changePct ?? 0))[0];
  const bigMover = sorted[0];

  const breadthPct = leaves.length > 0 ? Math.round((green.length / leaves.length) * 100) : 50;

  return {
    driver: {
      label: "Biggest mover",
      value: bigMover ? `${bigMover.symbol} ${bigMover.changePct != null ? ((bigMover.changePct >= 0 ? "+" : "") + bigMover.changePct.toFixed(1) + "%") : ""}` : "—",
      sub: bigMover?.shortName ?? "",
    },
    green: {
      label: "Top gainer",
      value: topGain ? `${topGain.symbol}` : "—",
      sub: topGain?.changePct != null ? `+${topGain.changePct.toFixed(2)}% today` : "",
    },
    drag: {
      label: "Top decliner",
      value: topLoss ? `${topLoss.symbol}` : "—",
      sub: topLoss?.changePct != null ? `${topLoss.changePct.toFixed(2)}% today` : "",
    },
    breadth: {
      label: "Breadth",
      value: `${green.length} of ${leaves.length} green`,
      sub: `${breadthPct}% advancing`,
    },
  };
}

export default async function MarketMapPage() {
  const [tree, supabase] = await Promise.all([fetchMarketMapTree(), createClient()]);
  const { data: { user } } = await supabase.auth.getUser();

  let isPro = false;
  let lookupsUsed = 0;
  if (user) {
    const [tier, used] = await Promise.all([
      getUserTier(supabase, user.id, user.email),
      getMapLookupsToday(supabase, user.id),
    ]);
    isPro = tier === "pro";
    lookupsUsed = used;
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  const lookupsLeft = isPro ? "Unlimited" : `${FREE_MAP_LOOKUPS_PER_DAY - lookupsUsed} of ${FREE_MAP_LOOKUPS_PER_DAY} lookups today`;

  const kicker = deriveMapKicker(tree);

  return (
    <div style={{ paddingBottom: 64 }}>
      {/* ── Masthead ── */}
      <LedgerMasthead
        eyebrow={`Cartography · ${timeStr}`}
        title="The map, in one glance"
        dek="Area encodes market capitalization; tint encodes the day's move. Click any tile to pull up headlines and a brief."
        dekStyle={{ maxWidth: "none", whiteSpace: "nowrap" }}
      />

      {/* ── Byline ── */}
      <LedgerByline
        left="Plotted by AlphaBrief AI · live data · updated every 60s"
        right={
          <span style={{ fontFamily: SANS_L, fontSize: 11, color: "var(--ab-faint)", fontVariantNumeric: "tabular-nums" }}>
            {lookupsLeft}
          </span>
        }
      />

      {/* ── Legend ── */}
      <LedgerRuleLabel>Legend</LedgerRuleLabel>
      <div className="flex items-center gap-6" style={{ fontSize: 11, color: "var(--ab-muted)", marginBottom: 14 }}>
        <div className="flex items-center gap-2">
          <span>−10%</span>
          <div style={{ width: 140, height: 6, background: "linear-gradient(90deg, rgba(244,63,94,.6), rgba(244,63,94,.15), rgba(16,185,129,.15), rgba(16,185,129,.6))" }} />
          <span>+10%</span>
        </div>
        <span>·</span>
        <span>area ∝ market cap</span>
        <span>·</span>
        <span>click tile for headlines</span>
      </div>

      {/* ── Map ── */}
      <MarketMapExplorer
        tree={tree}
        isPro={isPro}
        lookupsUsed={lookupsUsed}
        maxLookups={FREE_MAP_LOOKUPS_PER_DAY}
      />

      {/* ── What the map is saying — 4-col kicker ── */}
      <LedgerRuleLabel>What the map is saying</LedgerRuleLabel>
      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
        {[kicker.driver, kicker.green, kicker.drag, kicker.breadth].map((item) => (
          <div key={item.label} style={{ borderTop: "1px solid var(--ab-border)", paddingTop: 12 }}>
            <div style={{
              fontFamily: SANS_L, fontSize: 10, letterSpacing: ".22em",
              textTransform: "uppercase", color: "var(--ab-faint)",
              fontWeight: 700, marginBottom: 6,
            }}>
              {item.label}
            </div>
            <div style={{
              fontFamily: SERIF_L, fontSize: 20, fontWeight: 600, lineHeight: 1.15,
            }}>
              {item.value}
            </div>
            {item.sub && (
              <div style={{
                fontFamily: SERIF_L, fontStyle: "italic",
                fontSize: 13, color: "var(--ab-muted)", marginTop: 4,
              }}>
                {item.sub}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
