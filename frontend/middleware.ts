import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/billing", "/profile", "/admin", "/checkout"];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  function nextWithRequestId() {
    const headers = new Headers(req.headers);
    headers.set("x-request-id", requestId);
    const response = NextResponse.next({ request: { headers } });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  if (!isProtected) return nextWithRequestId();

  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("next-auth.session-token") ||
    req.cookies.has("__Secure-next-auth.session-token");

  if (!hasSession) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set("x-request-id", requestId);
    return response;
  }

  return nextWithRequestId();
}

export const config = {
  matcher: ["/dashboard/:path*", "/billing/:path*", "/profile/:path*", "/admin/:path*", "/checkout/:path*"]
};
