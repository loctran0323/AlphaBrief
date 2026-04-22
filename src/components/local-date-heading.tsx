"use client";

import { useEffect, useState } from "react";

/** Renders the date heading in the visitor's local timezone.
 *  Falls back to the server-rendered value (ET) on first paint to avoid a layout shift,
 *  then corrects to the browser timezone on hydration — no IP or location tracking needed. */
export function LocalDateHeading({ fallback }: { fallback: string }) {
  const [heading, setHeading] = useState(fallback);

  useEffect(() => {
    setHeading(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    );
  }, []);

  return <>{heading}</>;
}
