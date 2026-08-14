import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert, AlertDescription, Badge, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";

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
  const accessToken = await requireAccessToken("/conta");

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
      <h1 className="text-2xl font-black text-grafite">Minha conta</h1>

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

      <Link href="/contratos" className="text-sm font-semibold text-azul-planta">
        Meus contratos →
      </Link>
      <Link href="/analisar-orcamento" className="text-sm font-semibold text-azul-planta">
        Analisar orçamento →
      </Link>
      <Link href="/sinapi" className="text-sm font-semibold text-azul-planta">
        Consultar SINAPI (ES) →
      </Link>
      <Link href="/busca" className="text-sm font-semibold text-azul-planta">
        Buscar prestadores e fornecedores →
      </Link>

      {(me.tipo === "CLIENTE_PF" || me.tipo === "CLIENTE_PJ") && (
        <>
          <Link href="/obras" className="text-sm font-semibold text-azul-planta">
            Minhas obras →
          </Link>
          <Link href="/rfq" className="text-sm font-semibold text-azul-planta">
            Minhas RFQs →
          </Link>
          <Link href="/materiais" className="text-sm font-semibold text-azul-planta">
            Listas de materiais →
          </Link>
          <Link href="/compras" className="text-sm font-semibold text-azul-planta">
            Minhas compras de plantas →
          </Link>
        </>
      )}

      {me.tipo === "FORNECEDOR" && (
        <Link href="/conta/fornecedor" className="text-sm font-semibold text-azul-planta">
          Ir pro painel do fornecedor →
        </Link>
      )}
      {(me.tipo === "PRESTADOR" || me.tipo === "TECNICO") && (
        <>
          <Link href="/conta/prestador" className="text-sm font-semibold text-azul-planta">
            Ir pro painel do prestador →
          </Link>
          <Link href="/rfq/disponiveis" className="text-sm font-semibold text-azul-planta">
            Orçamentos disponíveis →
          </Link>
        </>
      )}
    </main>
  );
}
