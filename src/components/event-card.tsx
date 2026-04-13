import type { MarketEvent } from "@/types/database";

type EventType = MarketEvent["event_type"];

const typeStyles: Record<
  EventType,
  { bar: string; badge: string; label: string }
> = {
  macro: {
    bar: "bg-sky-500",
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    label: "Macro",
  },
  earnings: {
    bar: "bg-violet-500",
    badge: "border-violet-200 bg-violet-50 text-violet-700",
    label: "Earnings",
  },
  catalyst: {
    bar: "bg-amber-500",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    label: "Key event",
  },
};

function formatEventWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBD";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

type Props = {
  event: MarketEvent;
  showTickerBadge?: boolean;
  readMoreUrl?: string | null;
};

export function EventCard({ event, showTickerBadge = true, readMoreUrl }: Props) {
  const styles = typeStyles[event.event_type];
  const ticker = event.ticker?.trim();

  return (
    <article className="flex gap-0 py-5">
      <div className={`w-1 shrink-0 rounded-full ${styles.bar}`} aria-hidden />
      <div className="min-w-0 flex-1 pl-4 sm:pl-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--faint)]">
          <span className="font-mono tabular-nums">{formatEventWhen(event.event_date)}</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles.badge}`}
          >
            {styles.label}
          </span>
          {showTickerBadge && ticker ? (
            <span className="rounded-md border border-[var(--border)] bg-[var(--surface-highlight)] px-2 py-0.5 font-semibold text-[var(--foreground)]">
              {ticker}
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-lg font-semibold leading-snug text-[var(--foreground)]">
          {event.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{event.why_it_matters}</p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/90">
          <span className="font-medium text-[var(--foreground)]">Watch for: </span>
          {event.watch_for}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {readMoreUrl ? (
            <a
              href={readMoreUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-muted)]"
            >
              Read coverage →
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
