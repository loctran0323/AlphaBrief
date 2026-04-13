"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-8 text-center">
      <h2 className="text-lg font-semibold text-red-700">Something went wrong</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {error.message || "Unexpected error on the dashboard."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
        <Link href="/" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)]">
          Home
        </Link>
      </div>
    </div>
  );
}
