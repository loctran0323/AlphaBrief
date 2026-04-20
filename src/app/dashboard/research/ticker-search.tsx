"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TickerSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ticker = value.trim().toUpperCase();
    if (ticker) router.push(`/dashboard/research/${ticker}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        placeholder="e.g. AAPL, MSFT, NVDA"
        className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 font-mono text-sm font-semibold uppercase tracking-widest text-[var(--foreground)] placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-[var(--faint)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-muted)] disabled:opacity-40"
      >
        Search
      </button>
    </form>
  );
}
