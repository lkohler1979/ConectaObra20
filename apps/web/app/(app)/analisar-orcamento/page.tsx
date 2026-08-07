import Link from "next/link";
import { requireAccessToken } from "@/lib/auth-session";
import { AnalisarOrcamentoForm } from "./analisar-orcamento-form";

export default async function AnalisarOrcamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ servico?: string; cidade?: string; valor?: string }>;
}) {
  await requireAccessToken("/analisar-orcamento");
  const params = await searchParams;
  const valorCentavos = params.valor ? Math.round(Number(params.valor) * 100) : undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <div>
        <Link href="/conta" className="text-sm font-semibold text-grafite hover:text-laranja">
          ← Minha conta
        </Link>
        <h1 className="mt-2 text-2xl font-black text-grafite">Analisar orçamento</h1>
        <p className="mt-1 text-sm text-[#7A828C]">
          Compare um valor proposto com o custo médio regional cadastrado (SINAPI/CUB). Cálculo
          determinístico, sem IA generativa — se não houver dado cadastrado pra esse serviço e
          cidade, avisamos em vez de inventar uma resposta.
        </p>
      </div>

      <AnalisarOrcamentoForm
        defaultServico={params.servico}
        defaultCidade={params.cidade}
        defaultValorCentavos={valorCentavos && !Number.isNaN(valorCentavos) ? valorCentavos : undefined}
      />
    </main>
  );
}
