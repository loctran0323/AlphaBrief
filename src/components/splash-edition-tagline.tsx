"use client";

import { useEffect, useState } from "react";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;

export function SplashEditionTagline() {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const now = new Date();
    const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
    const vol = now.getMonth() + 1;
    const no  = now.getDate();
    setLabel(`Vol. ${vol}, No. ${no} · ${dayName} edition`);
  }, []);

  if (!label) return null;
  return (
    <span style={{ fontFamily: SERIF_L, fontStyle: "italic", color: "var(--ab-muted)", fontSize: 13 }}>
      {label}
    </span>
  );
}
