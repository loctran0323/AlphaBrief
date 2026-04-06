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

/** Wall clock in America/New_York → UTC `Date` (handles EST/EDT). */
export function wallTimeEtToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = `${year}-${pad(month)}-${pad(day)}`;
  const timePart = `${pad(hour)}:${pad(minute)}:00`;
  for (const offset of ["-05:00", "-04:00"] as const) {
    const candidate = new Date(`${datePart}T${timePart}${offset}`);
    if (Number.isNaN(candidate.getTime())) continue;
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: MARKET_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(candidate);
    const g = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value;
    const py = Number(g("year"));
    const pm = Number(g("month"));
    const pd = Number(g("day"));
    const ph = Number(g("hour"));
    const pmin = Number(g("minute"));
    if (py === year && pm === month && pd === day && ph === hour && pmin === minute) {
      return candidate;
    }
  }
  return new Date(`${datePart}T${timePart}-05:00`);
}

/** Start of Eastern calendar day for `d` (midnight ET). */
export function startOfEtDay(d: Date): Date {
  const ymd = formatDateInputValue(d);
  const [y, m, day] = ymd.split("-").map(Number);
  return wallTimeEtToUtc(y, m, day, 0, 0);
}
