import { NextResponse, type NextRequest } from "next/server"

const AUTH_COOKIE = "habitflow-auth"

/** The only page an administrator has. */
export const ADMIN_HOME = "/admin/dashboard"

/**
 * The routes an admin is allowed to be on: their own page, the landing page and the login page.
 * Everything else in this app is a surface for running your own week, which an admin account does
 * not do — it has no roles, no goals and no weekly plan, so `/dashboard` would render an empty
 * calendar and `/weekly-plan/goals` would invite it to plan a week nobody will ever look at.
 */
function isAllowedForAdmin(pathname: string): boolean {
  return pathname === "/" || pathname === "/login" || pathname.startsWith("/admin")
}

/**
 * Whether the browser is carrying an admin's session, read from the cookie the zustand auth store
 * persists into.
 *
 * The signature is **not** checked here, and does not need to be: this decides which page to draw,
 * never what data to hand over. Every `/admin/*` request re-checks `users.is_admin` on the row the
 * bearer token resolves to, so forging this claim buys a page that answers 403 — and clearing it
 * buys the app pages, which an admin account has nothing in anyway.
 */
function hasAdminClaim(request: NextRequest): boolean {
  const raw = request.cookies.get(AUTH_COOKIE)?.value
  if (!raw) return false

  try {
    // `RequestCookies` does not URL-decode, but a value that arrives already decoded parses on the
    // first attempt — so try it as given before decoding rather than assuming either shape.
    const stored = raw.startsWith("{") ? raw : decodeURIComponent(raw)
    const token: unknown = JSON.parse(stored)?.state?.token
    if (typeof token !== "string") return false

    const payload = token.split(".")[1]
    if (!payload) return false

    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).is_admin === true
  } catch {
    // A cookie that is absent, truncated or not ours is simply not an admin session. Anything that
    // throws here is a browser that gets the ordinary app, which is the safe direction to fail.
    return false
  }
}

/**
 * Keeps an administrator on the one page they have.
 *
 * A proxy (Next 16's name for what was `middleware.ts`) rather than a guard inside
 * `useRequireAuth`, because not every route calls that hook —
 * `/roles`, `/settings` and `/sharpen-the-saw` gate themselves through the API alone — so a hook
 * would have covered most of the app and quietly missed three pages. This runs before anything
 * renders, so there is also no frame of the dashboard before the redirect.
 *
 * It only ever redirects *admins away from* the app. A non-admin who types `/admin/dashboard` is
 * deliberately let through to be refused by the server, so the page can say why rather than
 * bouncing them somewhere with no explanation.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isAllowedForAdmin(pathname) || !hasAdminClaim(request)) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = ADMIN_HOME
  url.search = ""
  return NextResponse.redirect(url)
}

export const config = {
  // Everything but Next's own assets and static files — the app routes are the whole point, and a
  // proxy that ran on every image would be a cookie parse per request for nothing.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
