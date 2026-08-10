import { NextResponse, type NextRequest } from "next/server";
import { surplusCheckoutInputSchema } from "@conectaobra/types/material-surplus";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";

/** Público de propósito — checkout de convidado, sem cookie de sessão. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const body = await req.json();
  const parsed = surplusCheckoutInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let apiRes: Response;
  try {
    apiRes = await apiFetchOrThrow(`/public/surplus-listings/${id}/checkout`, {
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
  return NextResponse.json(data, { status: apiRes.status });
}
