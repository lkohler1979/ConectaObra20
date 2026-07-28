import { NextResponse, type NextRequest } from "next/server";
import { apiFetch } from "@/lib/api-client";
import { ACCESS_COOKIE, REFRESH_COOKIE, clearSessionCookies } from "@/lib/session";

export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;

  if (accessToken && refreshToken) {
    // Best-effort: mesmo se o backend falhar, limpamos os cookies locais de qualquer forma.
    await apiFetch("/auth/logout", {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);
  return response;
}
