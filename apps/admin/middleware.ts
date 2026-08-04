import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/session";

/**
 * Ao contrário de `apps/web` (majoritariamente público, com poucas rotas
 * protegidas), quase todo o admin exige sessão — por isso o matcher protege
 * tudo por padrão e só isenta login/API de auth/assets do Next.
 */
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
  matcher: ["/((?!entrar|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
