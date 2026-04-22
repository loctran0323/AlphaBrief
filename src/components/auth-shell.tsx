import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

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
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <header className="backdrop-blur-sm" style={{ borderBottom: "1px solid var(--nav-border)", background: "var(--nav-bg)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6C5CE7]">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13 2L4.5 13.5H11L11 22L19.5 10.5H13L13 2Z" />
              </svg>
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-white">AlphaBrief</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl p-8 shadow-sm" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{title}</h1>
            {subtitle && (
              <div className="mt-2 text-sm" style={{ color: "var(--muted)" }}>{subtitle}</div>
            )}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
