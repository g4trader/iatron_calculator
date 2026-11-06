import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/billing", "/profile", "/admin", "/checkout"];
const SKIN_COOKIE = "iatron_skin";
const CAMPAIGN_SKIN_PARAM = "utm_skin";
const VALID_SKINS = new Set(["dark", "light"]);

function campaignSkinFromRequest(req: NextRequest) {
  const value = req.nextUrl.searchParams.get(CAMPAIGN_SKIN_PARAM);
  return VALID_SKINS.has(value ?? "") ? value : null;
}

function cookieHeaderWithSkin(req: NextRequest, skin: string) {
  const existing = req.headers.get("cookie");
  const withoutSkin = existing
    ?.split(";")
    .map((item) => item.trim())
    .filter((item) => item && !item.startsWith(`${SKIN_COOKIE}=`))
    .join("; ");
  return withoutSkin ? `${withoutSkin}; ${SKIN_COOKIE}=${skin}` : `${SKIN_COOKIE}=${skin}`;
}

function persistCampaignSkin(response: NextResponse, req: NextRequest, skin: string | null) {
  if (!skin) return response;
  response.cookies.set(SKIN_COOKIE, skin, {
    httpOnly: false,
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  return response;
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const campaignSkin = campaignSkinFromRequest(req);

  function nextWithRequestId() {
    const headers = new Headers(req.headers);
    headers.set("x-request-id", requestId);
    if (campaignSkin) headers.set("cookie", cookieHeaderWithSkin(req, campaignSkin));
    const response = NextResponse.next({ request: { headers } });
    response.headers.set("x-request-id", requestId);
    return persistCampaignSkin(response, req, campaignSkin);
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
    return persistCampaignSkin(response, req, campaignSkin);
  }

  return nextWithRequestId();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};
