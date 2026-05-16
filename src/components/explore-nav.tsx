import Link from "next/link";

export function ExploreNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6C5CE7]">
            <svg className="h-[18px] w-[18px] text-white" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
              <path d="M32 6 L34 30 L32 32 L30 30 Z" />
              <path d="M32 58 L30 34 L32 32 L34 34 Z" />
              <path d="M10 32 L30 30 L32 32 L30 34 Z" />
              <path d="M54 32 L34 34 L32 32 L34 30 Z" />
            </svg>
          </div>
          <span className="text-base font-bold text-gray-900">AlphaBrief</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm sm:gap-5">
          <Link href="/explore" className="font-medium text-gray-900">
            Explore
          </Link>
          <Link href="/explore/map" className="text-gray-500 transition hover:text-gray-900">
            Map
          </Link>
          <span className="hidden h-4 w-px bg-gray-200 sm:block" aria-hidden />
          <Link href="/login" className="text-gray-500 transition hover:text-gray-900">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-gray-900 px-4 py-2 font-medium text-white transition hover:bg-gray-700"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
