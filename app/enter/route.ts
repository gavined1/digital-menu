import {
  createAccessCookieValue,
  getAccessCookieMaxAge,
  getAccessCookieName,
} from "@/lib/access-cookie";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /enter (and /enter?table=5 etc.)
 * Called when user scans the printed QR code (with any app) or when our in-app scanner redirects here.
 * Sets 12H access cookie and redirects to /menu.
 */
export async function GET(request: NextRequest) {
  const value = await createAccessCookieValue();
  const maxAge = getAccessCookieMaxAge();
  const name = getAccessCookieName();

  const res = NextResponse.redirect(new URL("/menu", request.url), 302);
  res.cookies.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
  return res;
}
