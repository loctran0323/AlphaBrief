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
        <div className="mx-auto max-w-5xl px-6 py-12">{children}</div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const setup = await ensureUserProfileAndWatchlist(supabase, user.id);
    if (!setup.ok) {
      return (
        <div className="min-h-screen">
          <AppNav email={user.email ?? undefined} signedIn />
          <div className="mx-auto max-w-5xl px-6 py-10">
            <DashboardSetupError message={setup.message} />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen">
      <AppNav email={user?.email ?? undefined} signedIn={Boolean(user)} />
      <div className="mx-auto max-w-5xl px-6 py-12">{children}</div>
    </div>
  );
}
