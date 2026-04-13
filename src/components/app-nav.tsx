import Link from "next/link";

export function AppNav({
  email,
  signedIn = Boolean(email),
}: {
  email?: string;
  signedIn?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/home" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6C5CE7]">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13 2L4.5 13.5H11L11 22L19.5 10.5H13L13 2Z" />
            </svg>
          </div>
          <span className="text-base font-bold text-gray-900">Alpha Brief</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link href="/home" className="text-gray-500 transition hover:text-gray-900">
            Home
          </Link>
          {signedIn ? (
            <>
              <Link href="/dashboard" className="text-gray-500 transition hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/dashboard/map" className="text-gray-500 transition hover:text-gray-900">
                Map
              </Link>
              <Link href="/dashboard/archive" className="text-gray-500 transition hover:text-gray-900">
                Archive
              </Link>
              <Link href="/dashboard/updates" className="text-gray-500 transition hover:text-gray-900">
                Updates
              </Link>
              <Link href="/dashboard/settings" className="text-gray-500 transition hover:text-gray-900">
                Settings
              </Link>
              {email && (
                <span className="hidden text-gray-400 sm:inline text-xs">{email}</span>
              )}
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-gray-500 transition hover:text-gray-900"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/explore" className="text-gray-500 transition hover:text-gray-900">
                Explore
              </Link>
              <Link href="/login?next=/home" className="text-gray-500 transition hover:text-gray-900">
                Log in
              </Link>
              <Link
                href="/signup?next=/home"
                className="rounded-md bg-gray-900 px-4 py-2 font-medium text-white transition hover:bg-gray-700"
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
