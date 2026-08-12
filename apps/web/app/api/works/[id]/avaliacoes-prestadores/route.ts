import { NextResponse, type NextRequest } from "next/server";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { ACCESS_COOKIE } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Sem sessão" }, { status: 401 });
  }

  let apiRes: Response;
  try {
    apiRes = await apiFetchOrThrow(`/works/${id}/avaliacoes-prestadores`, {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
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
