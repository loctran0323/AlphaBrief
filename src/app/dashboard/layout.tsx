import { AppNav } from "@/components/app-nav";
import { DashboardSetupError } from "@/components/dashboard-setup-error";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfileAndWatchlist } from "@/lib/supabase/ensure-user";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <p className="text-lg text-amber-400">Backend not connected</p>
        <p className="mt-2 text-[var(--muted)]">
          Accounts and data live in your Supabase project. Copy{" "}
          <code className="text-[var(--foreground)]">.env.example</code> to{" "}
          <code className="text-[var(--foreground)]">.env.local</code> and paste your
          project URL and anon key from the Supabase dashboard, then restart{" "}
          <code className="text-[var(--foreground)]">npm run dev</code>.
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

  return (
    <div className="min-h-screen">
      <AppNav email={user.email ?? undefined} signedIn />
      <div className="mx-auto max-w-5xl px-6 py-12">{children}</div>
    </div>
  );
}
