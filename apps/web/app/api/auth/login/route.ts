import { NextResponse, type NextRequest } from "next/server";
import { loginInputSchema, type UserPublic } from "@conectaobra/types/auth";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { setSessionCookies } from "@/lib/session";

interface LoginApiResponse {
  user: UserPublic;
  tokens:
    | { mfaRequired: false; accessToken: string; refreshToken: string; expiresIn: number }
    | { mfaRequired: true; mfaToken: string };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = loginInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let apiRes: Response;
  try {
    apiRes = await apiFetchOrThrow("/auth/login", {
      method: "POST",
      body: JSON.stringify(parsed.data),
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

  const data = await apiRes.json();

  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status });
  }

  const { user, tokens } = data as LoginApiResponse;

  // Fluxo de desafio MFA ainda não tem tela nesta interface (ver PENDENCIAS.md).
  if (tokens.mfaRequired) {
    return NextResponse.json(
      { message: "Esta conta tem verificação em duas etapas — ainda não suportada nesta interface." },
      { status: 501 },
    );
  }

  const response = NextResponse.json({ user });
  setSessionCookies(response, tokens);
  return response;
}
