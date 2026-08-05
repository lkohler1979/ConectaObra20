import Link from "next/link";
import type { Kpis } from "@conectaobra/types/kpis";
import { Alert, AlertDescription, Badge, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPercent(value: number): string {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function metaBadge(atingida: boolean) {
  return <Badge variant={atingida ? "verified" : "warning"}>{atingida ? "Na meta" : "Abaixo da meta"}</Badge>;
}

async function fetchKpis(accessToken: string): Promise<Kpis> {
  const res = await apiFetchOrThrow("/admin/kpis", {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Falha ao buscar KPIs: ${res.status}`);
  }
  return res.json();
}

export default async function KpisPage() {
  const accessToken = await requireAccessToken("/kpis");

  let kpis: Kpis;
  try {
    kpis = await fetchKpis(accessToken);
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar os KPIs agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }

  const disputasPercentual = kpis.confianca.disputasPorTransacao * 100;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-grafite hover:text-laranja">
          ← Painel
        </Link>
        <h1 className="text-2xl font-black text-grafite">KPIs</h1>
      </div>

      <p className="text-xs text-[#7A828C]">
        Calculado direto do Postgres em {new Date(kpis.computedAt).toLocaleString("pt-BR")} — não
        depende do PostHog (esse dashboard é só para os 6 objetivos do PRD §3).
      </p>

      <div className="flex flex-col gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <CardTitle>Liquidez do marketplace</CardTitle>
              {metaBadge(kpis.liquidez.percentualRespondidoEm24h >= 70)}
            </div>
            <p className="text-sm text-[#5B6875]">Orçamentos respondidos em &lt; 24h · meta ≥ 70%</p>
            <p className="mt-2 text-2xl font-black text-laranja">
              {formatPercent(kpis.liquidez.percentualRespondidoEm24h)}
            </p>
            <p className="text-xs text-[#7A828C]">
              {kpis.liquidez.totalRfqsConsiderados} RFQ(s) com ao menos 24h de vida
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <CardTitle>Confiança</CardTitle>
              {metaBadge(disputasPercentual < 2)}
            </div>
            <p className="text-sm text-[#5B6875]">Disputas / transações · meta &lt; 2%</p>
            <p className="mt-2 text-2xl font-black text-laranja">
              {formatPercent(disputasPercentual)}
            </p>
            <p className="text-xs text-[#7A828C]">
              {kpis.confianca.totalDisputas} disputa(s) / {kpis.confianca.totalTransacoes}{" "}
              transação(ões)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <CardTitle>Receita recorrente</CardTitle>
              {metaBadge(kpis.receita.mrrCentavos >= 25_000_000)}
            </div>
            <p className="text-sm text-[#5B6875]">MRR de assinaturas · meta R$ 250 mil</p>
            <p className="mt-2 text-2xl font-black text-laranja">
              {formatMoney(kpis.receita.mrrCentavos)}
            </p>
            <p className="text-xs text-[#7A828C]">
              {kpis.receita.totalAssinaturasAtivas} assinatura(s) ativa(s) — sem billing real
              ainda (E8)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <CardTitle>Adoção da IA</CardTitle>
              {metaBadge(kpis.adocaoIa.percentualClientesAtivosComIa >= 40)}
            </div>
            <p className="text-sm text-[#5B6875]">
              Clientes com ≥ 3 perguntas/semana · meta 40% dos clientes ativos
            </p>
            <p className="mt-2 text-2xl font-black text-laranja">
              {formatPercent(kpis.adocaoIa.percentualClientesAtivosComIa)}
            </p>
            <p className="text-xs text-[#7A828C]">
              {kpis.adocaoIa.totalClientesComTresPerguntasSemana} de {kpis.adocaoIa.totalClientes}{" "}
              cliente(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <CardTitle>Retenção do fornecedor</CardTitle>
              <Badge variant="warning">Sem dado</Badge>
            </div>
            <p className="text-sm text-[#5B6875]">Churn mensal de assinantes · meta &lt; 4%</p>
            <p className="mt-2 text-2xl font-black text-[#7A828C]">—</p>
            <p className="text-xs text-[#7A828C]">
              Sem billing real ainda (E8 não implementado) — não há evento de cancelamento pra
              medir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <CardTitle>Ativação</CardTitle>
              {metaBadge(kpis.ativacao.percentualAtivadoEm7Dias >= 50)}
            </div>
            <p className="text-sm text-[#5B6875]">
              Cliente cria obra + 1 orçamento em 7 dias · meta ≥ 50%
            </p>
            <p className="mt-2 text-2xl font-black text-laranja">
              {formatPercent(kpis.ativacao.percentualAtivadoEm7Dias)}
            </p>
            <p className="text-xs text-[#7A828C]">
              {kpis.ativacao.totalClientesConsiderados} cliente(s) considerado(s)
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
