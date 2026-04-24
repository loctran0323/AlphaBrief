import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--ab-bg)", fontFamily: SANS_L }}>
      {/* Nav — matches AppNav */}
      <header style={{
        borderBottom: "1px solid var(--ab-border)",
        background: "var(--ab-bg)",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <div style={{
          maxWidth: 1180, margin: "0 auto",
          padding: "14px 40px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6, background: ACCENT,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M13 2L4.5 13.5H11L11 22L19.5 10.5H13L13 2Z" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.01em", color: "var(--ab-fg)" }}>
              AlphaBrief
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Centered form */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "calc(100vh - 57px)", padding: "48px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Masthead */}
          <div style={{ borderBottom: "2px solid var(--ab-fg)", paddingBottom: 20, marginBottom: 28 }}>
            <h1 style={{
              fontFamily: SERIF_L, fontSize: 36, fontWeight: 600,
              letterSpacing: "-.02em", lineHeight: 1.05, margin: 0, color: "var(--ab-fg)",
            }}>{title}</h1>
            {subtitle && (
              <div style={{
                fontFamily: SERIF_L, fontStyle: "italic", fontSize: 15,
                color: "var(--ab-muted)", marginTop: 8,
              }}>{subtitle}</div>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
