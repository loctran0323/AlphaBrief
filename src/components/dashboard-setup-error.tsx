export function DashboardSetupError({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-amber-500/40 bg-amber-500/10 px-6 py-8 text-center">
      <h1 className="text-lg font-semibold text-amber-700">Dashboard can&apos;t load yet</h1>
      <p className="mt-3 text-left text-sm leading-relaxed text-[var(--muted)]">{message}</p>
      <p className="mt-4 text-left text-sm text-[var(--muted)]">
        <strong className="text-[var(--foreground)]">First time?</strong> In Supabase →{" "}
        <span className="text-[var(--foreground)]">SQL Editor</span>, run the file{" "}
        <code className="rounded bg-gray-100 px-1 font-mono text-xs">supabase/migrations/001_initial.sql</code>
        , then{" "}
        <code className="rounded bg-gray-100 px-1 font-mono text-xs">002_profiles_insert_policy.sql</code>
        , then optional <code className="rounded bg-white/10 px-1">supabase/seed.sql</code>{" "}
        for sample events.
      </p>
    </div>
  );
}
