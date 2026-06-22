import { AppNav } from "@/components/app-nav";
import { DashboardSetupError } from "@/components/dashboard-setup-error";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfileAndWatchlist } from "@/lib/supabase/ensure-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div style={{ maxWidth: 560, margin: "80px auto", padding: "0 40px 80px", textAlign: "center" }}>
        <p style={{ fontSize: 16, color: "#D97706" }}>Backend not connected</p>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--ab-muted)" }}>
          Copy <code style={{ color: "var(--ab-fg)" }}>.env.example</code> to{" "}
          <code style={{ color: "var(--ab-fg)" }}>.env.local</code> and paste your Supabase
          project URL and anon key, then restart <code style={{ color: "var(--ab-fg)" }}>npm run dev</code>.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The dashboard shell is public: read-only views (Map, Research) render for
  // everyone. Personal pages (Briefing, Settings, Archive, Account) guard
  // themselves and redirect anonymous visitors to /login.
  if (user) {
    const setup = await ensureUserProfileAndWatchlist(supabase, user.id);
    if (!setup.ok) {
      return (
        <div className="min-h-screen">
          <AppNav email={user.email ?? undefined} signedIn />
          <div style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 40px 60px" }}>
            <DashboardSetupError message={setup.message} />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen">
      <AppNav email={user?.email ?? undefined} signedIn={Boolean(user)} />
      <div className="px-4 sm:px-10" style={{ maxWidth: 1040, margin: "0 auto", paddingTop: 36, paddingBottom: 60 }}>{children}</div>
    </div>
  );
}
