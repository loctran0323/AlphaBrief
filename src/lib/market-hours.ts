/**
 * US stock market (NYSE/NASDAQ) open/closed status.
 * Returns status, color, and a human-readable reason.
 */

export type MarketStatus = {
  isOpen: boolean;
  label: string;       // e.g. "Open", "Closed", "Pre-market"
  reason: string;      // e.g. "Regular hours", "After hours", "Weekend", "Holiday: Christmas"
  color: "green" | "yellow" | "red";
};

// NYSE/NASDAQ holidays (YYYY-MM-DD in ET) — updated through 2027
const MARKET_HOLIDAYS: Record<string, string> = {
  // 2025
  "2025-01-01": "New Year's Day",
  "2025-01-20": "MLK Day",
  "2025-02-17": "Presidents Day",
  "2025-04-18": "Good Friday",
  "2025-05-26": "Memorial Day",
  "2025-07-04": "Independence Day",
  "2025-09-01": "Labor Day",
  "2025-11-27": "Thanksgiving",
  "2025-12-25": "Christmas",
  // 2026
  "2026-01-01": "New Year's Day",
  "2026-01-19": "MLK Day",
  "2026-02-16": "Presidents Day",
  "2026-04-03": "Good Friday",
  "2026-05-25": "Memorial Day",
  "2026-07-03": "Independence Day (observed)",
  "2026-09-07": "Labor Day",
  "2026-11-26": "Thanksgiving",
  "2026-12-25": "Christmas",
  // 2027
  "2027-01-01": "New Year's Day",
  "2027-01-18": "MLK Day",
  "2027-02-15": "Presidents Day",
  "2027-03-26": "Good Friday",
  "2027-05-31": "Memorial Day",
  "2027-07-05": "Independence Day (observed)",
  "2027-09-06": "Labor Day",
  "2027-11-25": "Thanksgiving",
  "2027-12-24": "Christmas (observed)",
};

// Early close days (1:00 PM ET) — day before Thanksgiving, July 3rd (if not already holiday), Dec 24
const EARLY_CLOSE_DAYS: Record<string, string> = {
  "2025-07-03": "Independence Day Eve",
  "2025-11-26": "Thanksgiving Eve",
  "2025-12-24": "Christmas Eve",
  "2026-11-27": "Thanksgiving Eve",
  "2026-12-24": "Christmas Eve",
  "2027-07-02": "Independence Day Eve",
  "2027-11-24": "Thanksgiving Eve",
};

function toETDateString(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // YYYY-MM-DD
}

function getETHourMinute(date: Date): { hour: number; minute: number } {
  const etStr = date.toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [h, m] = etStr.split(":").map(Number);
  return { hour: h, minute: m };
}

export function getMarketStatus(now: Date = new Date()): MarketStatus {
  const dateStr = toETDateString(now);
  const { hour, minute } = getETHourMinute(now);
  const totalMinutes = hour * 60 + minute;

  // Day of week in ET
  const dayOfWeek = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  ).getDay(); // 0=Sun, 6=Sat

  // Weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { isOpen: false, label: "Closed", reason: "Weekend", color: "red" };
  }

  // Holiday
  if (MARKET_HOLIDAYS[dateStr]) {
    return {
      isOpen: false,
      label: "Closed",
      reason: `Holiday: ${MARKET_HOLIDAYS[dateStr]}`,
      color: "red",
    };
  }

  // Early close (1:00 PM ET = 780 minutes)
  const isEarlyClose = !!EARLY_CLOSE_DAYS[dateStr];
  const closeTime = isEarlyClose ? 780 : 960; // 1:00 PM or 4:00 PM

  // Market open: 9:30 AM (570 min) to close
  const OPEN_START = 570;  // 9:30 AM
  const PREMARKET_START = 240; // 4:00 AM
  const AFTERHOURS_END = 1200; // 8:00 PM

  if (totalMinutes >= OPEN_START && totalMinutes < closeTime) {
    const closeLabel = isEarlyClose ? "Early close 1:00 PM ET" : "Regular hours · closes 4:00 PM ET";
    return { isOpen: true, label: "Open", reason: closeLabel, color: "green" };
  }

  if (totalMinutes >= PREMARKET_START && totalMinutes < OPEN_START) {
    return { isOpen: false, label: "Pre-market", reason: "Opens 9:30 AM ET", color: "yellow" };
  }

  if (totalMinutes >= closeTime && totalMinutes < AFTERHOURS_END) {
    return {
      isOpen: false,
      label: "After hours",
      reason: isEarlyClose ? "Closed early today" : "Closed 4:00 PM ET",
      color: "yellow",
    };
  }

  return { isOpen: false, label: "Closed", reason: "Outside trading hours", color: "red" };
}
