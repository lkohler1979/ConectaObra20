import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Alert, AlertDescription, Badge, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { ACCESS_COOKIE } from "@/lib/session";
import { LogoutButton } from "./logout-button";

const TIPO_LABEL: Record<string, string> = {
  CLIENTE_PF: "Cliente (pessoa física)",
  CLIENTE_PJ: "Cliente (empresa)",
  PRESTADOR: "Prestador de serviço",
  FORNECEDOR: "Fornecedor de materiais",
  TECNICO: "Técnico",
  ADMIN: "Administrador",
};

interface MeResponse {
  nome: string;
  email: string;
  tipo: string;
  telefone: string | null;
  telefoneVerificado: boolean;
}

export default async function ContaPage() {
  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    redirect("/entrar?redirect=/conta");
  }

  let res: Response;
  try {
    res = await apiFetchOrThrow("/profile/me", {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar sua conta agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
          <LogoutButton />
        </main>
      );
    }
    throw err;
  }

  if (!res.ok) {
    redirect("/entrar?redirect=/conta");
  }

  const me: MeResponse = await res.json();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 bg-areia px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-grafite">Minha conta</h1>
        <LogoutButton />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-4">
          <div>
            <CardTitle>{me.nome}</CardTitle>
            <p className="text-sm text-[#5B6875]">{me.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{TIPO_LABEL[me.tipo] ?? me.tipo}</Badge>
            <Badge variant={me.telefoneVerificado ? "verified" : "warning"}>
              {me.telefoneVerificado ? "Telefone verificado" : "Telefone não verificado"}
            </Badge>
          </div>
          {me.telefone && <p className="text-sm text-grafite">{me.telefone}</p>}
        </CardContent>
      </Card>
    </main>
  );
}
