import { NextResponse, type NextRequest } from "next/server";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { REFRESH_COOKIE, setSessionCookies, clearSessionCookies } from "@/lib/session";

/**
 * Renova o access token usando o refresh token do cookie. Não é chamado
 * automaticamente ainda (mesma limitação de `apps/web` — sem retry-on-401
 * nem refresh silencioso agendado). Sessão expira em JWT_ACCESS_TTL_SECONDS
 * (15min por padrão) e exige novo login.
 */
export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: "Sem sessão" }, { status: 401 });
  }

  let apiRes: Response;
  try {
    apiRes = await apiFetchOrThrow("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return NextResponse.json(
        { message: "Serviço indisponível no momento. Tente novamente em instantes." },
        { status: 502 },
      );
    }
    throw err;
  }

  if (!apiRes.ok) {
    const response = NextResponse.json({ message: "Sessão expirada" }, { status: 401 });
    clearSessionCookies(response);
    return response;
  }

  const tokens = await apiRes.json();
  const response = NextResponse.json({ ok: true });
  setSessionCookies(response, tokens);
  return response;
}
