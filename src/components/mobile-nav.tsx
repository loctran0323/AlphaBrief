"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const SERIF = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT = "#6C5CE7";

type NavItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {open ? (
        /* X icon */
        <>
          <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : (
        /* Hamburger */
        <>
          <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function SidebarLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "block",
        padding: "13px 24px",
        fontFamily: SERIF,
        fontSize: 17,
        fontWeight: 500,
        color: "var(--ab-fg)",
        textDecoration: "none",
        borderBottom: "1px solid var(--ab-border)",
        transition: "background .1s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--ab-surface)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {label}
    </Link>
  );
}

function SidebarSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: "16px 24px 6px",
      fontFamily: SANS,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: ".2em",
      textTransform: "uppercase",
      color: "var(--ab-faint)",
    }}>
      {children}
    </div>
  );
}

export function MobileNav({
  signedIn,
  tier,
  email,
}: {
  signedIn: boolean;
  tier: "free" | "pro";
  email?: string;
}) {
  const [open, setOpen] = useState(false);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const close = () => setOpen(false);

  return (
    <>
      {/* Hamburger trigger — mobile only */}
      {/* flex on mobile, hidden on sm+ (≥640px = desktop) */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex sm:hidden items-center justify-center"
        style={{
          width: 32,
          height: 32,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--ab-fg)",
          padding: 0,
          flexShrink: 0,
        }}
      >
        <HamburgerIcon open={open} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 98,
          }}
        />
      )}

      {/* Sidebar panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "78vw",
          maxWidth: 300,
          background: "var(--ab-bg)",
          borderRight: "1px solid var(--ab-border)",
          zIndex: 99,
          overflowY: "auto",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform .25s cubic-bezier(.4,0,.2,1)",
        }}
        aria-hidden={!open}
      >
        {/* Sidebar header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "2px solid var(--ab-fg)",
        }}>
          <div>
            <div style={{
              fontFamily: SANS,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-.01em",
              color: "var(--ab-fg)",
            }}>AlphaBrief</div>
            {email && (
              <div style={{
                fontFamily: SANS,
                fontSize: 11,
                color: "var(--ab-faint)",
                marginTop: 2,
                maxWidth: 180,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>{email}</div>
            )}
          </div>
          {tier === "pro" && (
            <span style={{
              fontFamily: SANS,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: ACCENT,
              border: `1px solid ${ACCENT}`,
              padding: "2px 6px",
            }}>Pro</span>
          )}
        </div>

        {/* Main nav */}
        {signedIn ? (
          <>
            <SidebarSectionLabel>Navigate</SidebarSectionLabel>
            <SidebarLink href="/home"               label="Market"    onClick={close} />
            <SidebarLink href="/dashboard"          label="Briefing"  onClick={close} />
            <SidebarLink href="/dashboard/map"      label="Map"       onClick={close} />
            <SidebarLink href="/dashboard/research" label="Research"  onClick={close} />

            {tier === "pro" ? (
              <SidebarLink href="/dashboard/archive" label="Archive" onClick={close} />
            ) : (
              <Link
                href="/dashboard/upgrade"
                onClick={close}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 24px",
                  fontFamily: SERIF,
                  fontSize: 17,
                  fontWeight: 500,
                  color: "var(--ab-faint)",
                  textDecoration: "none",
                  borderBottom: "1px solid var(--ab-border)",
                }}
              >
                Archive
                <span style={{
                  fontFamily: SANS,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: ACCENT,
                  border: `1px solid ${ACCENT}`,
                  padding: "1px 5px",
                }}>Pro</span>
              </Link>
            )}

            <SidebarSectionLabel>Account</SidebarSectionLabel>
            <SidebarLink href="/dashboard/settings"      label="Digest"       onClick={close} />
            <SidebarLink href="/dashboard/subscription"  label="Subscription" onClick={close} />
            <SidebarLink href="/dashboard/account"       label="Account"      onClick={close} />
            <SidebarLink href="/dashboard/contact"       label="Contact"      onClick={close} />

            {/* Sign out */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--ab-border)", marginTop: 8 }}>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  style={{
                    fontFamily: SERIF,
                    fontSize: 14,
                    color: "var(--ab-faint)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    letterSpacing: ".04em",
                  }}
                >
                  Sign out →
                </button>
              </form>
            </div>

            {/* Upgrade CTA for free users */}
            {tier === "free" && (
              <div style={{ padding: "0 24px 24px" }}>
                <Link
                  href="/dashboard/upgrade"
                  onClick={close}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "10px",
                    background: ACCENT,
                    color: "#fff",
                    fontFamily: SANS,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                  }}
                >
                  Upgrade to Pro · $9/mo
                </Link>
              </div>
            )}
          </>
        ) : (
          <>
            <SidebarSectionLabel>Get started</SidebarSectionLabel>
            <SidebarLink href="/login"  label="Log in"      onClick={close} />
            <SidebarLink href="/signup" label="Sign up free" onClick={close} />
          </>
        )}

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          marginTop: "auto",
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 11,
          color: "var(--ab-faint)",
          borderTop: "1px solid var(--ab-border)",
        }}>
          AlphaBrief · est. 2026
        </div>
      </div>
    </>
  );
}
