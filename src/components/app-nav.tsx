"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

function UserMenu({ email, tier }: { email?: string; tier: "free" | "pro" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = email ? email[0].toUpperCase() : "?";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 transition hover:bg-gray-200"
        aria-label="Account menu"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg">
          {email && (
            <div className="border-b border-gray-100 px-4 py-2.5">
              <p className="truncate text-xs font-medium text-gray-900">{email}</p>
              {tier === "pro" ? (
                <span className="mt-0.5 inline-block rounded-full bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-semibold text-[#6C5CE7]">
                  Pro
                </span>
              ) : (
                <span className="mt-0.5 inline-block text-[10px] text-gray-400">Free plan</span>
              )}
            </div>
          )}
          <div className="py-1">
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Digest
            </Link>
            <Link
              href="/dashboard/contact"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Contact us
            </Link>
            <Link
              href="/dashboard/subscription"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              Subscription
            </Link>
          </div>
          <div className="border-t border-gray-100 py-1">
            <Link
              href="/dashboard/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Account
            </Link>
          </div>
          <div className="border-t border-gray-100 py-1">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
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
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6C5CE7]">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13 2L4.5 13.5H11L11 22L19.5 10.5H13L13 2Z" />
            </svg>
          </div>
          <span className="text-base font-bold text-gray-900">AlphaBrief</span>
        </Link>

        {/* Primary nav */}
        <nav className="flex items-center gap-1 text-sm">
          {signedIn ? (
            <>
              <Link href="/home" className="rounded-md px-3 py-1.5 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900">
                Home
              </Link>
              <Link href="/dashboard" className="rounded-md px-3 py-1.5 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/dashboard/map" className="rounded-md px-3 py-1.5 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900">
                Map
              </Link>
              <Link href="/dashboard/research" className="rounded-md px-3 py-1.5 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900">
                Research
              </Link>
              {tier === "pro" ? (
                <Link href="/dashboard/archive" className="rounded-md px-3 py-1.5 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900">
                  Archive
                </Link>
              ) : (
                <Link
                  href="/dashboard/upgrade"
                  className="flex items-center gap-1 rounded-md px-3 py-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-[#6C5CE7]"
                >
                  Archive
                  <span className="rounded bg-[#EDE9FE] px-1 py-0.5 text-[10px] font-semibold text-[#6C5CE7]">
                    Pro
                  </span>
                </Link>
              )}

              {/* Divider */}
              <span className="mx-1 h-4 w-px bg-gray-200" />

              {tier === "free" && (
                <Link
                  href="/dashboard/upgrade"
                  className="rounded-md border border-[#6C5CE7]/30 bg-[#EDE9FE] px-3 py-1.5 text-xs font-semibold text-[#6C5CE7] transition hover:bg-[#6C5CE7] hover:text-white"
                >
                  Upgrade
                </Link>
              )}

              <UserMenu email={email} tier={tier} />
            </>
          ) : (
            <>
              <Link href="/login?next=/home" className="rounded-md px-3 py-1.5 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900">
                Log in
              </Link>
              <Link
                href="/signup?next=/home"
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
