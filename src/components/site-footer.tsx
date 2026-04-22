"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function SiteFooter() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    function sync() {
      setDark(document.documentElement.classList.contains("dark"));
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Light mode: dark bg (#111827) + light text
  // Dark mode: light bg (#F1F5F9) + dark text
  const bg = dark ? "#F1F5F9" : "#111827";
  const text = dark ? "#111827" : "#FFFFFF";
  const muted = dark ? "#6B7280" : "#9CA3AF";
  const mutedHover = dark ? "#111827" : "#FFFFFF";

  return (
    <footer className="py-8" style={{ background: bg }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6C5CE7]">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13 2L4.5 13.5H11L11 22L19.5 10.5H13L13 2Z" />
            </svg>
          </div>
          <span className="font-bold" style={{ color: text }}>AlphaBrief</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#pricing" className="text-sm transition" style={{ color: muted }}
            onMouseEnter={e => (e.currentTarget.style.color = mutedHover)}
            onMouseLeave={e => (e.currentTarget.style.color = muted)}
          >
            Pricing
          </Link>
          <Link href="/legal" className="text-sm transition" style={{ color: muted }}
            onMouseEnter={e => (e.currentTarget.style.color = mutedHover)}
            onMouseLeave={e => (e.currentTarget.style.color = muted)}
          >
            Privacy and terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
