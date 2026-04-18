import { getAccessCookieName, verifyAccessCookieValue } from "@/lib/access-cookie";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieName = getAccessCookieName();
  const cookieValue = request.cookies.get(cookieName)?.value;

  const hasValidAccess =
    cookieValue != null && (await verifyAccessCookieValue(cookieValue));

  if (pathname === "/") {
    if (hasValidAccess) {
      return NextResponse.redirect(new URL("/menu", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/menu")) {
    if (!hasValidAccess) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/menu", "/menu/"],
};
