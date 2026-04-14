"use client";

import { useState } from "react";

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-7 space-y-2">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-muted)] disabled:opacity-60"
      >
        {loading ? "Redirecting to Stripe…" : "Upgrade to Pro — $4/mo"}
      </button>
    </div>
  );
}
