import Link from "next/link";

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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6C5CE7]">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13 2L4.5 13.5H11L11 22L19.5 10.5H13L13 2Z" />
              </svg>
            </div>
            <span className="text-base font-bold text-gray-900">AlphaBrief</span>
          </Link>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <div className="mt-2 text-sm text-gray-500">{subtitle}</div>
            )}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
