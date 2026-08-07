"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PurchaseQuotePublic, MaterialListComparisonItem } from "@conectaobra/types/purchase-quotes";
import { Alert, AlertDescription, Badge, Button, Card, CardContent, CardTitle } from "@conectaobra/ui";

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_LABEL: Record<string, string> = {
  SOLICITADA: "Aguardando resposta",
  RESPONDIDA: "Respondida",
};

export function ComparadorPanel({
  materialListId,
  cotacoes,
  comparativo,
}: {
  materialListId: string;
  cotacoes: PurchaseQuotePublic[];
  comparativo: MaterialListComparisonItem[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [solicitando, setSolicitando] = useState(false);

  async function solicitarCotacoes() {
    setErro(null);
    setSolicitando(true);
    const res = await fetch(`/api/material-lists/${materialListId}/quote`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível solicitar cotações.",
      );
      setSolicitando(false);
      return;
    }
    setSolicitando(false);
    router.refresh();
  }

  async function fecharCompra(quoteId: string) {
    if (!window.confirm("Fechar compra com esta cotação?")) return;
    setErro(null);
    setLoadingId(quoteId);
    const res = await fetch(`/api/purchase-quotes/${quoteId}/checkout`, { method: "POST" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setErro(typeof data?.message === "string" ? data.message : "Não foi possível fechar a compra.");
      setLoadingId(null);
      return;
    }
    router.push("/compras-materiais");
  }

  return (
    <div className="flex flex-col gap-4">
      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <Button size="sm" variant="secondary" className="self-start" onClick={solicitarCotacoes} disabled={solicitando}>
        {solicitando ? "Solicitando…" : "Solicitar cotações"}
      </Button>

      {cotacoes.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhuma cotação solicitada ainda.</p>
      ) : (
        <div>
          <h2 className="mb-2 text-sm font-bold text-grafite">Cotações</h2>
          <div className="flex flex-col gap-2">
            {cotacoes.map((cotacao) => (
              <Card key={cotacao.id}>
                <CardContent className="flex items-center justify-between gap-3 pt-4">
                  <span className="text-sm font-semibold text-grafite">{cotacao.fornecedorNome}</span>
                  <Badge variant={cotacao.status === "RESPONDIDA" ? "verified" : "warning"}>
                    {STATUS_LABEL[cotacao.status] ?? cotacao.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {comparativo.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-bold text-grafite">Comparador</h2>
          <div className="flex flex-col gap-3">
            {comparativo.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex flex-col gap-2 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle>{item.fornecedorNome}</CardTitle>
                    <span className="text-lg font-black text-laranja">
                      {formatMoney(item.totalCentavos)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.menorPreco && <Badge variant="verified">Menor preço</Badge>}
                    {item.menorFrete && <Badge variant="verified">Menor frete</Badge>}
                    {item.menorPrazo && <Badge variant="verified">Mais rápido</Badge>}
                    {item.melhorAvaliacao && <Badge variant="verified">Melhor avaliação</Badge>}
                  </div>
                  <p className="text-xs text-[#7A828C]">
                    Frete: {item.freteCentavos != null ? formatMoney(item.freteCentavos) : "—"} · Prazo:{" "}
                    {item.prazoDias ?? "—"} dias
                    {item.notaMediaFornecedor != null && ` · Nota: ${item.notaMediaFornecedor.toFixed(1)}`}
                  </p>
                  <Button
                    size="sm"
                    className="self-start"
                    disabled={loadingId === item.id}
                    onClick={() => fecharCompra(item.id)}
                  >
                    {loadingId === item.id ? "Fechando…" : "Fechar compra"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
