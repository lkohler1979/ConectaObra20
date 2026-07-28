import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/session";

export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has(ACCESS_COOKIE);
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/conta/:path*"],
};
