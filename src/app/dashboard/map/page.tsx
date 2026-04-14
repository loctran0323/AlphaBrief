import { MarketMapExplorer } from "@/components/market-map-explorer";
import { fetchMarketMapTree } from "@/lib/market-map-data";
import { createClient } from "@/lib/supabase/server";
import { getUserTier, getMapLookupsToday, FREE_MAP_LOOKUPS_PER_DAY } from "@/lib/subscription";

export const dynamic = "force-dynamic";

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

  return (
    <MarketMapExplorer
      tree={tree}
      isPro={isPro}
      lookupsUsed={lookupsUsed}
      maxLookups={FREE_MAP_LOOKUPS_PER_DAY}
    />
  );
}
