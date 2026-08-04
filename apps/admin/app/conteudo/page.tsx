import Link from "next/link";
import { Card, CardContent, CardTitle } from "@conectaobra/ui";
import { requireAccessToken } from "@/lib/auth-session";

const SECOES = [
  {
    titulo: "Notícias e biblioteca",
    descricao: "CRUD de artigos — portal de notícias e biblioteca de guias/checklists.",
    href: "/conteudo/artigos",
  },
  {
    titulo: "Indicadores de mercado",
    descricao: "CUB, INCC, SINAPI, aço, cimento, madeira.",
    href: "/conteudo/indicadores",
  },
  {
    titulo: "Custos médios",
    descricao: "Tabela de custos médios por cidade e serviço.",
    href: "/conteudo/custos-medios",
  },
];

export default async function ConteudoPage() {
  await requireAccessToken("/conteudo");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-grafite hover:text-laranja">
          ← Painel
        </Link>
        <h1 className="text-2xl font-black text-grafite">Conteúdo</h1>
      </div>

      <div className="flex flex-col gap-3">
        {SECOES.map((secao) => (
          <Link key={secao.titulo} href={secao.href}>
            <Card className="transition-colors hover:border-azul-planta">
              <CardContent className="pt-4">
                <CardTitle>{secao.titulo}</CardTitle>
                <p className="mt-1 text-sm text-[#5B6875]">{secao.descricao}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
