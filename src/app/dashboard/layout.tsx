import { AppNav } from "@/components/app-nav";
import { DashboardSetupError } from "@/components/dashboard-setup-error";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfileAndWatchlist } from "@/lib/supabase/ensure-user";
import { getUserTier } from "@/lib/subscription";
import { redirect } from "next/navigation";

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

  if (!user) {
    redirect("/login");
  }

  const [setup, tier] = await Promise.all([
    ensureUserProfileAndWatchlist(supabase, user.id),
    getUserTier(supabase, user.id, user.email),
  ]);

  if (!setup.ok) {
    return (
      <div className="min-h-screen">
        <AppNav email={user.email ?? undefined} signedIn tier={tier} />
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 40px 60px" }}>
          <DashboardSetupError message={setup.message} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppNav email={user.email ?? undefined} signedIn tier={tier} />
      <div className="ab-dash-pad" style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 40px 60px" }}>{children}</div>
    </div>
  );
}
