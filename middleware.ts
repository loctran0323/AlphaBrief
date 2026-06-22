import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/middleware";

const publicPaths = ["/", "/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/dashboard/home") {
    return NextResponse.redirect(new URL("/home", request.url));
  }
  // /privacy was an older, thinner duplicate of /legal — consolidate permanently.
  if (pathname === "/privacy") {
    return NextResponse.redirect(new URL("/legal", request.url), 308);
  }

  if (!getSupabaseUrl() || !getSupabaseAnonKey()) {
    return NextResponse.next();
  }

  const isCron = pathname.startsWith("/api/cron");
  // Read-only views are public — anyone can browse the market, briefing,
  // research, map, and archive without an account (signed-in visitors see
  // their watchlist threaded in). Only account pages (settings, account,
  // contact) stay behind login. API routes that mutate per-user data still
  // enforce auth inside their own handlers.
  const isPublic =
    pathname === "/" ||
    pathname === "/home" ||
    pathname === "/legal" ||
    pathname === "/dashboard" ||
    publicPaths.includes(pathname) ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/dashboard/research") ||
    pathname.startsWith("/dashboard/map") ||
    pathname.startsWith("/dashboard/archive") ||
    pathname.startsWith("/api/news/") ||
    pathname.startsWith("/api/quotes") ||
    pathname.startsWith("/api/research/") ||
    pathname.startsWith("/api/market/");

  let supabaseResponse = NextResponse.next({ request });
  let user: Awaited<ReturnType<typeof updateSession>>["user"] = null;

  try {
    const session = await updateSession(request);
    supabaseResponse = session.supabaseResponse;
    user = session.user;
  } catch (err) {
    console.error("[middleware] Supabase session failed:", err);
    if (!isPublic && !isCron) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      url.searchParams.set("error", "session");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!isPublic && !isCron && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if ((pathname === "/login" || pathname === "/signup") && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
