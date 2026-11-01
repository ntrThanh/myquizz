import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { routes } from "@/lib/routes";

// Chỉ là lớp chặn sớm dựa trên việc có cookie hay không; kiểm tra thật nằm ở page, server action và DAL.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const url = new URL(routes.login, request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/learn/:path*", "/admin/:path*"],
};
