import { NextResponse, type NextRequest } from "next/server";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { ACCESS_COOKIE } from "@/lib/session";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const { id, userId } = await params;
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Sem sessão" }, { status: 401 });
  }

  let apiRes: Response;
  try {
    apiRes = await apiFetchOrThrow(`/works/${id}/equipe/${userId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${accessToken}` },
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

  if (apiRes.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  const data = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}
