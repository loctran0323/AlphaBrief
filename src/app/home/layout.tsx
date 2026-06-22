import { AppNav } from "@/components/app-nav";
import { DashboardSetupError } from "@/components/dashboard-setup-error";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfileAndWatchlist } from "@/lib/supabase/ensure-user";

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen">
        <AppNav signedIn={false} />
        <div className="px-4 sm:px-10" style={{ maxWidth: 1120, margin: "0 auto", paddingTop: 36, paddingBottom: 60 }}>{children}</div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The market view is public — anyone can read it. Signed-in visitors also
  // get their saved watchlist set up; anonymous visitors just browse.
  if (user) {
    const setup = await ensureUserProfileAndWatchlist(supabase, user.id);
    if (!setup.ok) {
      return (
        <div className="min-h-screen">
          <AppNav email={user.email ?? undefined} signedIn />
          <div style={{ maxWidth: 1120, margin: "0 auto", padding: "36px 40px 60px" }}>
            <DashboardSetupError message={setup.message} />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen">
      <AppNav email={user?.email ?? undefined} signedIn={Boolean(user)} />
      <div className="px-4 sm:px-10" style={{ maxWidth: 1120, margin: "0 auto", paddingTop: 36, paddingBottom: 60 }}>{children}</div>
    </div>
  );
}
