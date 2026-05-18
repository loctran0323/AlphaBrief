"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";

const SERIF = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT_NAV = "#6C5CE7";

const MENU_ITEMS = [
  { href: "/dashboard/settings",     label: "Digest" },
  { href: "/dashboard/subscription", label: "Subscription" },
  { href: "/dashboard/contact",      label: "Contact" },
] as const;

function menuItemStyle(hover = false): React.CSSProperties {
  return {
    display: "block",
    width: "100%",
    padding: "9px 20px",
    fontFamily: SERIF,
    fontSize: 14,
    color: hover ? "var(--ab-fg)" : "var(--ab-muted)",
    background: hover ? "var(--ab-surface)" : "transparent",
    textDecoration: "none",
    border: "none",
    textAlign: "left" as const,
    cursor: "pointer",
    transition: "color .1s, background .1s",
  };
}

function MenuItem({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onClick={onClick}
      style={menuItemStyle(hov)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {label}
    </Link>
  );
}

function MenuButton({ label, onClick }: { label: string; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="submit"
      style={menuItemStyle(hov)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function UserMenu({ email, tier }: { email?: string; tier: "free" | "pro" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const initials = email ? email[0].toUpperCase() : "?";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 26, height: 26,
          background: "var(--ab-surface)",
          fontFamily: SANS, fontWeight: 700, fontSize: 11,
          color: "var(--ab-muted)",
          border: "1px solid var(--ab-border)",
          cursor: "pointer",
        }}
      >
        {initials}
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 6px)",
          width: 200, zIndex: 50,
          background: "var(--ab-card)",
          border: "1px solid var(--ab-border)",
        }}>
          {/* Email + tier */}
          {email && (
            <div style={{
              padding: "10px 20px 8px",
              borderBottom: "1px solid var(--ab-border)",
            }}>
              <p style={{
                fontFamily: SANS, fontSize: 11, fontWeight: 600,
                color: "var(--ab-fg)", overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0,
              }}>{email}</p>
              {tier === "pro" ? (
                <span style={{
                  display: "inline-block", marginTop: 4,
                  fontFamily: SANS, fontSize: 9, fontWeight: 700,
                  letterSpacing: ".12em", textTransform: "uppercase",
                  color: ACCENT_NAV, background: "rgba(108,92,231,.12)",
                  padding: "2px 6px",
                }}>Pro</span>
              ) : (
                <span style={{
                  display: "inline-block", marginTop: 4,
                  fontFamily: SANS, fontSize: 10, color: "var(--ab-faint)",
                }}>Free plan</span>
              )}
            </div>
          )}

          {/* Main items */}
          <div style={{ paddingTop: 4, paddingBottom: 4 }}>
            {MENU_ITEMS.map((item) => (
              <MenuItem key={item.href} href={item.href} label={item.label} onClick={() => setOpen(false)} />
            ))}
          </div>

          {/* Account */}
          <div style={{ borderTop: "1px solid var(--ab-border)", paddingTop: 4, paddingBottom: 4 }}>
            <MenuItem href="/dashboard/account" label="Account" onClick={() => setOpen(false)} />
          </div>

          {/* Sign out */}
          <div style={{ borderTop: "1px solid var(--ab-border)", paddingTop: 4, paddingBottom: 4 }}>
            <form action="/auth/signout" method="post">
              <MenuButton label="Sign out" />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/** Ledger editorial edition tagline — computed client-side to avoid SSR mismatch */
function EditionTagline() {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const now = new Date();
    const dayName  = now.toLocaleDateString("en-US", { weekday: "long" });
    const vol = now.getMonth() + 1;   // 1–12 (month)
    const no  = now.getDate();         // 1–31 (day)
    setLabel(`Vol. ${vol}, No. ${no} · ${dayName} edition`);
  }, []);

  if (!label) return null;
  return (
    <span
      style={{
        fontFamily: SERIF,
        fontStyle: "italic",
        color: "var(--ab-muted)",
        fontSize: 13,
      }}
    >
      {label}
    </span>
  );
}

export function AppNav({
  email,
  signedIn = Boolean(email),
  tier = "free",
}: {
  email?: string;
  signedIn?: boolean;
  tier?: "free" | "pro";
}) {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--ab-border)",
        background: "var(--ab-bg)",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <div
        className="ab-nav-wrap"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "14px 40px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        {/* Left: Hamburger (mobile) + Logo + edition tagline */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Mobile hamburger — MobileNav renders both the button and the panel */}
          <MobileNav signedIn={signedIn} tier={tier} email={email} />
          <Link href="/home" className="flex items-center gap-2 shrink-0">
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: "#6C5CE7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="17" height="17" viewBox="0 0 64 64" fill="#fff" aria-hidden="true">
                <path d="M32 6 L34 30 L32 32 L30 30 Z" />
                <path d="M32 58 L30 34 L32 32 L34 34 Z" />
                <path d="M10 32 L30 30 L32 32 L30 34 Z" />
                <path d="M54 32 L34 34 L32 32 L34 30 Z" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.01em", color: "var(--ab-fg)" }}>
              AlphaBrief
            </span>
          </Link>
          <span className="ab-nav-tagline" style={{ color: "var(--ab-faint)" }}>·</span>
          <span className="ab-nav-tagline"><EditionTagline /></span>
        </div>

        {/* Right: nav links + controls */}
        <div className="flex items-center gap-5" style={{ fontSize: 13, color: "var(--ab-muted)" }}>

          {/* Text navigation links — hidden on mobile */}
          {signedIn ? (
            <nav className="ab-nav-links flex items-center gap-5" style={{
              fontFamily: SERIF, fontSize: 16, fontStyle: "italic",
              fontWeight: 400, letterSpacing: "-.005em",
            }}>
              {[
                { href: "/home",               label: "Market"   },
                { href: "/dashboard",          label: "Briefing" },
                { href: "/dashboard/map",      label: "Map"      },
                { href: "/dashboard/research", label: "Research" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{ color: "var(--ab-muted)", transition: "color .15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--ab-fg)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--ab-muted)"; }}
                >
                  {label}
                </Link>
              ))}

              {tier === "pro" ? (
                <Link
                  href="/dashboard/archive"
                  style={{ color: "var(--ab-muted)", transition: "color .15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--ab-fg)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--ab-muted)"; }}
                >
                  Archive
                </Link>
              ) : (
                <Link
                  href="/dashboard/upgrade"
                  className="flex items-center gap-1"
                  style={{ color: "var(--ab-faint)" }}
                >
                  Archive
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      fontStyle: "normal",
                      color: "#6C5CE7",
                      border: "1px solid #6C5CE7",
                      padding: "1px 5px",
                    }}
                  >
                    Pro
                  </span>
                </Link>
              )}

              <span style={{ width: 1, height: 16, background: "var(--ab-border)", display: "inline-block" }} />

              {tier === "free" && (
                <Link
                  href="/dashboard/upgrade"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    color: "#6C5CE7",
                    border: "1px solid #6C5CE7",
                    padding: "4px 10px",
                  }}
                >
                  Upgrade
                </Link>
              )}
            </nav>
          ) : (
            <nav className="ab-nav-links flex items-center gap-4">
              <Link
                href="/login?next=/home"
                style={{ color: "var(--ab-muted)", fontWeight: 500, transition: "color .15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--ab-fg)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--ab-muted)"; }}
              >
                Log in
              </Link>
              <Link
                href="/signup?next=/home"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  background: "var(--ab-fg)",
                  color: "var(--ab-bg)",
                  padding: "7px 14px",
                }}
              >
                Sign up free
              </Link>
            </nav>
          )}

          {/* Controls — ThemeToggle always visible; UserMenu hidden on mobile (sidebar handles it) */}
          <ThemeToggle />
          {signedIn && (
            <div className="hidden sm:block">
              <UserMenu email={email} tier={tier} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
