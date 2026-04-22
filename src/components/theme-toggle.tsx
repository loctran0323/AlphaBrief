"use client";

import { type CSSProperties, useEffect, useState } from "react";

function SunIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  }

  // Render placeholder to avoid layout shift before mount
  if (!mounted) {
    return <div className="h-7 w-[72px]" />;
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center gap-1.5 rounded-full p-1 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7]/50"
      style={{ background: dark ? "var(--surface)" : "var(--border)" }}
    >
      {/* Sun icon */}
      <SunIcon
        className="h-3.5 w-3.5 shrink-0 transition-all duration-300"
        style={{ color: dark ? "var(--faint)" : "#F59E0B", opacity: dark ? 0.5 : 1 }}
      />

      {/* Pill track */}
      <div
        className="relative h-5 w-9 rounded-full transition-colors duration-300"
        style={{ background: dark ? "#6C5CE7" : "#D1D5DB" }}
      >
        {/* Sliding circle */}
        <div
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out"
          style={{ transform: dark ? "translateX(18px)" : "translateX(2px)" }}
        />
      </div>

      {/* Moon icon */}
      <MoonIcon
        className="h-3.5 w-3.5 shrink-0 transition-all duration-300"
        style={{ color: dark ? "#818CF8" : "var(--faint)", opacity: dark ? 1 : 0.5 }}
      />
    </button>
  );
}
