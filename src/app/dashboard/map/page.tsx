import { MapV2Client } from "@/components/map-v2-client";
import { fetchMarketMapTree } from "@/lib/market-map-data";
import { getMarketStatus } from "@/lib/market-hours";
import type { MarketMapSector } from "@/lib/market-map-data";

export const dynamic = "force-dynamic";

/** Derive "What the map is saying" kicker stats from the tree. */
function deriveMapKicker(
  tree: Awaited<ReturnType<typeof fetchMarketMapTree>>,
) {
  type Leaf = { symbol: string; changePct?: number; shortName?: string };
  const leaves: Leaf[] = [];
  for (const sector of tree.children as MarketMapSector[]) {
    for (const industry of sector.children) {
      for (const leaf of industry.children) {
        leaves.push(leaf);
      }
    }
  }

  const green    = leaves.filter(l => (l.changePct ?? 0) >= 0);
  const sorted   = [...leaves].sort((a, b) => Math.abs(b.changePct ?? 0) - Math.abs(a.changePct ?? 0));
  const topGain  = [...leaves].sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))[0];
  const topLoss  = [...leaves].sort((a, b) => (a.changePct ?? 0) - (b.changePct ?? 0))[0];
  const bigMover = sorted[0];
  const breadthPct = leaves.length > 0 ? Math.round((green.length / leaves.length) * 100) : 50;

  return {
    driver: {
      label: "Biggest mover",
      value: bigMover
        ? `${bigMover.symbol} ${bigMover.changePct != null ? ((bigMover.changePct >= 0 ? "+" : "") + bigMover.changePct.toFixed(1) + "%") : ""}`
        : "—",
      sub: bigMover?.shortName ?? "",
    },
    green: {
      label: "Top gainer",
      value: topGain ? topGain.symbol : "—",
      sub: topGain?.changePct != null ? `+${topGain.changePct.toFixed(2)}% today` : "",
    },
    drag: {
      label: "Top decliner",
      value: topLoss ? topLoss.symbol : "—",
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
  const tree = await fetchMarketMapTree();

  const now = new Date();
  const marketStatus = getMarketStatus(now);
  const kicker = deriveMapKicker(tree);

  return (
    <MapV2Client
      tree={tree}
      marketStatus={marketStatus}
      kicker={kicker}
    />
  );
}
