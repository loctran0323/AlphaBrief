/** US Eastern (handles EST / EDT). Used for market-facing “today” and clocks on the dashboard. */
export const MARKET_TIME_ZONE = "America/New_York";

function calendarPartsEt(d: Date): { y: string; m: string; day: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MARKET_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return { y, m, day };
}

/** `YYYY-MM-DD` for the calendar day in Eastern Time (e.g. date inputs). */
export function formatDateInputValue(d: Date): string {
  const { y, m, day } = calendarPartsEt(d);
  return `${y}-${m}-${day}`;
}

/** Long weekday heading, Eastern calendar date (matches US market “today”). */
export function formatDateHeading(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: MARKET_TIME_ZONE,
  });
}

/** Short 12h time in Eastern (e.g. “11:22 PM”). Pass `{ seconds: true }` to include seconds. */
export function formatEtTimeShort(d: Date, opts?: { seconds?: boolean }): string {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    ...(opts?.seconds ? { second: "2-digit" } : {}),
    hour12: true,
    timeZone: MARKET_TIME_ZONE,
  });
}
