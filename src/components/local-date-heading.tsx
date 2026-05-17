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

/** Eyebrow variant: optional prefix (e.g. "Daily Briefing · ") + local date. */
export function LocalDateEyebrow({
  prefix = "",
  fallback,
}: {
  prefix?: string;
  fallback: string;
}) {
  const [text, setText] = useState(`${prefix}${fallback}`);

  useEffect(() => {
    const local = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setText(`${prefix}${local}`);
  }, [prefix]);

  return <>{text}</>;
}

/** Short 12h time in the visitor's local timezone (e.g. "11:02 PM").
 *  Server/SSR pass: uses the provided fallback (typically ET-formatted) so
 *  hydration is stable. Client effect: re-renders in the browser's TZ. */
export function LocalTimeShort({
  at,
  fallback,
}: {
  at: string;
  fallback: string;
}) {
  const [text, setText] = useState(fallback);

  useEffect(() => {
    setText(
      new Date(at).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    );
  }, [at]);

  return <>{text}</>;
}
