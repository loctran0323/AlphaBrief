"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addTickerValidated } from "@/app/dashboard/actions";

/** Compact sizes: "sm" for inline/header use, "md" for dashboard panel */
export function AddTickerForm({
  watchlistId,
  size = "sm",
  placeholder = "AAPL",
}: {
  watchlistId: string;
  size?: "sm" | "md";
  placeholder?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(addTickerValidated, null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state.error) {
      setShowError(true);
      const t = setTimeout(() => setShowError(false), 4000);
      return () => clearTimeout(t);
    } else {
      // success — reset the input
      formRef.current?.reset();
    }
  }, [state]);

  const inputCls =
    size === "md"
      ? "w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25"
      : "w-28 rounded-lg border bg-[var(--surface)] px-2.5 py-1 font-mono text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20";

  const btnCls =
    size === "md"
      ? "rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-muted)] disabled:opacity-50"
      : "rounded-lg bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50";

  return (
    <div className="relative">
      {/* Error toast */}
      {showError && state?.error && (
        <div
          className="absolute bottom-full left-0 z-20 mb-2 flex items-center gap-2 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 shadow-sm"
          role="alert"
        >
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {state.error}
        </div>
      )}

      <form
        ref={formRef}
        action={action}
        className={size === "md" ? "flex flex-col gap-3 sm:flex-row sm:items-stretch" : "flex items-center gap-2"}
      >
        <input type="hidden" name="watchlist_id" value={watchlistId} />
        <input
          name="ticker"
          placeholder={placeholder}
          maxLength={16}
          autoComplete="off"
          className={inputCls}
          style={{ borderColor: "var(--border)" }}
        />
        <button type="submit" disabled={pending} className={btnCls}>
          {pending ? "…" : "Add"}
        </button>
      </form>
    </div>
  );
}
