"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const ACCENT  = "#6C5CE7";

/** Serif underline date input — matches LP_Archive reference exactly. */
const dateInputStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: SERIF_L,
  fontSize: 16,
  padding: "4px 0",
  border: "none",
  borderBottom: "1px solid var(--ab-fg)",
  background: "transparent",
  color: "var(--ab-fg)",
  outline: "none",
};

type Props = {
  eventsFromYmd: string;
  eventsToYmd: string;
  newsFromYmd: string;
  newsToYmd: string;
};

export function ArchiveDateToolbar({
  eventsFromYmd,
  eventsToYmd,
  newsFromYmd,
  newsToYmd,
}: Props) {
  const router = useRouter();
  const [ef, setEf] = useState(eventsFromYmd);
  const [et, setEt] = useState(eventsToYmd);
  const [nf, setNf] = useState(newsFromYmd);
  const [nt, setNt] = useState(newsToYmd);

  useEffect(() => {
    setEf(eventsFromYmd);
    setEt(eventsToYmd);
    setNf(newsFromYmd);
    setNt(newsToYmd);
  }, [eventsFromYmd, eventsToYmd, newsFromYmd, newsToYmd]);

  function apply() {
    const q = new URLSearchParams();
    q.set("eventsFrom", ef);
    q.set("eventsTo", et);
    q.set("newsFrom", nf);
    q.set("newsTo", nt);
    router.push(`/dashboard/archive?${q.toString()}`);
  }

  const sections = [
    {
      label: "Past timeline",
      from: ef, setFrom: setEf,
      to: et,   setTo:   setEt,
    },
    {
      label: "Archived news",
      from: nf, setFrom: setNf,
      to: nt,   setTo:   setNt,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 8 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 0 }}>
        {sections.map((sec, si) => (
          <div
            key={sec.label}
            className={si === 1 ? "border-t sm:border-t-0 sm:border-l border-[var(--ab-border)] pt-6 sm:pt-0 sm:pl-8 mt-2 sm:mt-0" : ""}
          >
            <div style={{ fontFamily: SERIF_L, fontSize: 16, fontWeight: 600, marginBottom: 10 }}>
              {sec.label}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: SANS_L, fontSize: 10, letterSpacing: ".16em",
                  textTransform: "uppercase", color: "var(--ab-faint)", marginBottom: 4,
                }}>From</div>
                <input
                  type="date"
                  value={sec.from}
                  onChange={(e) => sec.setFrom(e.target.value)}
                  style={dateInputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: SANS_L, fontSize: 10, letterSpacing: ".16em",
                  textTransform: "uppercase", color: "var(--ab-faint)", marginBottom: 4,
                }}>To</div>
                <input
                  type="date"
                  value={sec.to}
                  onChange={(e) => sec.setTo(e.target.value)}
                  style={dateInputStyle}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          type="button"
          onClick={apply}
          style={{
            fontFamily: SANS_L, fontSize: 11, fontWeight: 600,
            letterSpacing: ".08em", textTransform: "uppercase",
            color: "#fff", background: ACCENT, border: "none",
            padding: "6px 16px", cursor: "pointer",
          }}
        >
          Apply ranges
        </button>
        <Link
          href="/dashboard/archive"
          style={{
            fontFamily: SANS_L, fontSize: 11, fontWeight: 600,
            letterSpacing: ".08em", textTransform: "uppercase",
            color: "var(--ab-fg)", border: "1px solid var(--ab-border)",
            padding: "6px 16px", textDecoration: "none",
          }}
        >
          Reset defaults
        </Link>
      </div>
    </div>
  );
}
