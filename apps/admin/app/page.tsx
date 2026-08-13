import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert, AlertDescription, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { LogoutButton } from "@/components/logout-button";

interface MeResponse {
  nome: string;
  email: string;
  tipo: string;
}

const SECOES = [
  {
    titulo: "Usuários",
    descricao: "Buscar contas, ver detalhes, suspender/reativar.",
    href: "/usuarios",
  },
  {
    titulo: "Disputas",
    descricao: "Fila de mediação — aprovar, estornar ou liberar parcial.",
    href: "/disputas",
  },
  {
    titulo: "Avaliações",
    descricao: "Moderar avaliações abertas de prestador, fornecedor e produto.",
    href: "/avaliacoes",
  },
  {
    titulo: "Conteúdo",
    descricao: "Notícias, biblioteca, indicadores e custos médios.",
    href: "/conteudo",
  },
  {
    titulo: "Cadastro assistido",
    descricao: "Onboarding em campo dos 200 prestadores-piloto.",
    href: "/prestadores-piloto",
  },
  {
    titulo: "KPIs",
    descricao: "Liquidez, confiança, receita, adoção de IA, churn e ativação.",
    href: "/kpis",
  },
];

export default async function AdminHomePage() {
  const accessToken = await requireAccessToken("/");

  let res: Response;
  try {
    res = await apiFetchOrThrow("/profile/me", {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar o painel agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }

  if (!res.ok) {
    redirect("/entrar?redirect=%2F");
  }

  const me: MeResponse = await res.json();

  // Defesa em profundidade: o route handler de login já bloqueia sessão pra
  // quem não é ADMIN, mas nunca confiar só nisso pra uma área tão sensível.
  if (me.tipo !== "ADMIN") {
    redirect("/entrar?redirect=%2F");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-grafite">ConectaObra Admin</h1>
          <p className="text-sm text-[#5B6875]">
            {me.nome} · {me.email}
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="flex flex-col gap-3">
        {SECOES.map((secao) => {
          const conteudo = (
            <CardContent className="pt-4">
              <CardTitle>{secao.titulo}</CardTitle>
              <p className="mt-1 text-sm text-[#5B6875]">{secao.descricao}</p>
              {!secao.href && (
                <p className="mt-2 text-xs text-[#7A828C]">Em breve nesta próxima rodada.</p>
              )}
            </CardContent>
          );
          return secao.href ? (
            <Link key={secao.titulo} href={secao.href}>
              <Card className="transition-colors hover:border-azul-planta">{conteudo}</Card>
            </Link>
          ) : (
            <Card key={secao.titulo}>{conteudo}</Card>
          );
        })}
      </div>
    </main>
  );
}
