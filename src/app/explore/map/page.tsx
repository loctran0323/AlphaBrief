import Link from "next/link";
import { MarketMapExplorer } from "@/components/market-map-explorer";
import { fetchMarketMapTree } from "@/lib/market-map-data";

export default async function ExploreMapPage() {
  const tree = await fetchMarketMapTree();
  return (
    <div>
      <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface-highlight)] px-5 py-3 text-sm text-[var(--muted)]">
        Same map as signed-in users.{" "}
        <Link href="/signup" className="font-medium text-[var(--accent)] hover:underline">
          Sign up
        </Link>{" "}
        to save a watchlist and access the full dashboard.
      </div>
      <MarketMapExplorer tree={tree} />
    </div>
  );
}
