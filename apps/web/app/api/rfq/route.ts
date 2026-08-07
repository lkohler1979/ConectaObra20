import { NextResponse, type NextRequest } from "next/server";
import { createRfqInputSchema } from "@conectaobra/types/rfq";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { ACCESS_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Sem sessão" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createRfqInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let apiRes: Response;
  try {
    apiRes = await apiFetchOrThrow("/rfq", {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}` },
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
  return NextResponse.json(data, { status: apiRes.status });
}
