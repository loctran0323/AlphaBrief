import { AppNav } from "@/components/app-nav";
import { DashboardSetupError } from "@/components/dashboard-setup-error";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfileAndWatchlist } from "@/lib/supabase/ensure-user";
import { getUserTier } from "@/lib/subscription";
import { redirect } from "next/navigation";

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen">
        <AppNav signedIn={false} />
        <div className="ab-dash-pad" style={{ maxWidth: 1120, margin: "0 auto", padding: "36px 40px 60px" }}>{children}</div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Require sign-in — unauthenticated visitors go to the landing page
  if (!user) {
    redirect("/");
  }

  const [setup, tier] = await Promise.all([
    ensureUserProfileAndWatchlist(supabase, user.id),
    getUserTier(supabase, user.id, user.email),
  ]);

  if (!setup.ok) {
    return (
      <div className="min-h-screen">
        <AppNav email={user.email ?? undefined} signedIn tier={tier} />
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "36px 40px 60px" }}>
          <DashboardSetupError message={setup.message} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppNav email={user.email ?? undefined} signedIn tier={tier} />
      <div className="ab-dash-pad" style={{ maxWidth: 1120, margin: "0 auto", padding: "36px 40px 60px" }}>{children}</div>
    </div>
  );
}
