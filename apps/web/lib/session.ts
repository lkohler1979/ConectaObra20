import type { NextResponse } from "next/server";

export const ACCESS_COOKIE = "co_access_token";
export const REFRESH_COOKIE = "co_refresh_token";

/** Bate com JWT_REFRESH_TTL_DAYS default do backend (services/api). */
const REFRESH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const isProd = process.env.NODE_ENV === "production";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** httpOnly: o JS do browser nunca vê o token — mitiga roubo via XSS. */
export function setSessionCookies(response: NextResponse, tokens: SessionTokens): void {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: tokens.expiresIn,
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
}
