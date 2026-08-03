import { NextResponse, type NextRequest } from "next/server";
import { apiUrl } from "@/lib/api-client";
import { ACCESS_COOKIE } from "@/lib/session";

/**
 * Multipart não pode passar por apiFetch: ela força
 * "content-type: application/json", o que quebraria o boundary do
 * FormData. Chama fetch direto pro services/api aqui.
 */
export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Sem sessão" }, { status: 401 });
  }

  const incoming = await req.formData();
  const file = incoming.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'Nenhum arquivo enviado (campo "file")' }, { status: 400 });
  }

  const outgoing = new FormData();
  outgoing.set("file", file, file.name);

  let apiRes: Response;
  try {
    apiRes = await fetch(`${apiUrl()}/products/import`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}` },
      body: outgoing,
    });
  } catch {
    return NextResponse.json(
      { message: "Serviço indisponível no momento. Tente novamente em instantes." },
      { status: 502 },
    );
  }

  const data = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}
