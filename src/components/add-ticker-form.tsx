"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addTickerValidated } from "@/app/dashboard/actions";

const SANS_L = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT = "#6C5CE7";

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
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div style={{ position: "relative" }}>
      {/* Error toast */}
      {showError && state?.error && (
        <div
          role="alert"
          style={{
            position: "absolute", bottom: "100%", left: 0,
            marginBottom: 8, whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: SANS_L, fontSize: 11,
            color: "#DC2626", background: "#FEF2F2",
            border: "1px solid #FECACA", padding: "5px 10px",
            zIndex: 20,
          }}
        >
          <svg style={{ width: 12, height: 12, flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {state.error}
        </div>
      )}

      <form
        ref={formRef}
        action={action}
        style={size === "md"
          ? { display: "flex", flexDirection: "column", gap: 8 }
          : { display: "flex", alignItems: "center", gap: 6 }
        }
      >
        <input type="hidden" name="watchlist_id" value={watchlistId} />
        <input
          name="ticker"
          placeholder={placeholder}
          maxLength={16}
          autoComplete="off"
          style={{
            fontFamily: SANS_L,
            fontSize: size === "md" ? 14 : 12,
            color: "var(--ab-fg)",
            background: "var(--ab-surface)",
            border: "1px solid var(--ab-border)",
            padding: size === "md" ? "7px 10px" : "4px 8px",
            outline: "none",
            width: size === "md" ? "100%" : 100,
            maxWidth: size === "md" ? 280 : undefined,
          }}
        />
        <button
          type="submit"
          disabled={pending}
          style={{
            fontFamily: SANS_L,
            fontSize: size === "md" ? 12 : 11,
            fontWeight: 700,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "#fff",
            background: ACCENT,
            border: "none",
            padding: size === "md" ? "7px 16px" : "4px 10px",
            cursor: "pointer",
            opacity: pending ? .5 : 1,
          }}
        >
          {pending ? "…" : "Add"}
        </button>
      </form>
    </div>
  );
}
