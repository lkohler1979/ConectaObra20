"use client";

import { useState } from "react";
import type { PurchaseQuoteItemPreco, PurchaseQuotePublic } from "@conectaobra/types/purchase-quotes";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardTitle,
  Input,
  KanbanBoard,
  KanbanColumn,
} from "@conectaobra/ui";

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ResponderForm({
  cotacao,
  onRespondida,
}: {
  cotacao: PurchaseQuotePublic;
  onRespondida: (quote: PurchaseQuotePublic) => void;
}) {
  const [precos, setPrecos] = useState<number[]>(
    cotacao.materialListItens.map(() => 0),
  );
  const [freteCentavos, setFreteCentavos] = useState("");
  const [prazoDias, setPrazoDias] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function setPreco(i: number, reais: string) {
    setPrecos((prev) => prev.map((v, idx) => (idx === i ? Math.round(Number(reais) * 100) : v)));
  }

  async function responder() {
    setErro(null);
    setLoading(true);

    const itensPrecos: PurchaseQuoteItemPreco[] = cotacao.materialListItens.map((item, i) => ({
      descricao: item.descricao,
      quantidade: item.quantidade,
      unidade: item.unidade,
      precoUnitarioCentavos: precos[i] ?? 0,
    }));

    const res = await fetch(`/api/purchase-quotes/${cotacao.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        itensPrecos,
        freteCentavos: freteCentavos === "" ? 0 : Math.round(Number(freteCentavos) * 100),
        prazoDias: Number(prazoDias),
      }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível responder a cotação.",
      );
      return;
    }
    onRespondida(data as PurchaseQuotePublic);
  }

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-concreto pt-2">
      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}
      {cotacao.materialListItens.length === 0 ? (
        <p className="text-xs text-[#7A828C]">Sem itens pra precificar nesta cotação.</p>
      ) : (
        cotacao.materialListItens.map((item, i) => (
          <div key={`${item.descricao}-${i}`} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-grafite/80">
              {item.descricao} ({item.quantidade} {item.unidade})
            </span>
            <Input
              type="number"
              step="0.01"
              min={0}
              placeholder="R$/un"
              className="w-24"
              onChange={(e) => setPreco(i, e.target.value)}
            />
          </div>
        ))
      )}
      <div className="flex gap-2">
        <Input
          type="number"
          step="0.01"
          min={0}
          placeholder="Frete (R$)"
          value={freteCentavos}
          onChange={(e) => setFreteCentavos(e.target.value)}
        />
        <Input
          type="number"
          min={1}
          placeholder="Prazo (dias)"
          value={prazoDias}
          onChange={(e) => setPrazoDias(e.target.value)}
        />
      </div>
      <Button size="sm" disabled={loading || !prazoDias} onClick={responder}>
        {loading ? "Enviando…" : "Responder cotação"}
      </Button>
    </div>
  );
}

function CotacaoCard({
  cotacao,
  onAtualizar,
}: {
  cotacao: PurchaseQuotePublic;
  onAtualizar: (quote: PurchaseQuotePublic) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">Cotação de materiais</CardTitle>
          {cotacao.status === "SOLICITADA" && <Badge variant="warning">Aguardando resposta</Badge>}
        </div>
        <p className="mt-1 text-xs text-grafite/80">
          {cotacao.materialListItens.length}{" "}
          {cotacao.materialListItens.length === 1 ? "item" : "itens"}
        </p>
        {cotacao.freteCentavos != null && (
          <p className="mt-1 text-xs text-[#7A828C]">
            Frete {formatMoney(cotacao.freteCentavos)} · {cotacao.prazoDias}{" "}
            {cotacao.prazoDias === 1 ? "dia" : "dias"}
          </p>
        )}

        {cotacao.status === "SOLICITADA" && (
          <ResponderForm cotacao={cotacao} onRespondida={onAtualizar} />
        )}
      </CardContent>
    </Card>
  );
}

export function CotacoesKanban({ cotacoesIniciais }: { cotacoesIniciais: PurchaseQuotePublic[] }) {
  const [cotacoes, setCotacoes] = useState(cotacoesIniciais);

  function atualizar(quote: PurchaseQuotePublic) {
    setCotacoes((prev) => prev.map((c) => (c.id === quote.id ? quote : c)));
  }

  const solicitadas = cotacoes.filter((c) => c.status === "SOLICITADA");
  const respondidas = cotacoes.filter((c) => c.status === "RESPONDIDA" && !c.pedidoFechado);
  const convertidas = cotacoes.filter((c) => c.pedidoFechado);

  if (cotacoes.length === 0) {
    return <p className="text-sm text-[#5B6875]">Nenhuma cotação de material recebida ainda.</p>;
  }

  return (
    <KanbanBoard>
      <KanbanColumn title="Solicitada" count={solicitadas.length}>
        {solicitadas.map((c) => (
          <CotacaoCard key={c.id} cotacao={c} onAtualizar={atualizar} />
        ))}
      </KanbanColumn>
      <KanbanColumn title="Respondida" count={respondidas.length}>
        {respondidas.map((c) => (
          <CotacaoCard key={c.id} cotacao={c} onAtualizar={atualizar} />
        ))}
      </KanbanColumn>
      <KanbanColumn title="Convertida em pedido" count={convertidas.length}>
        {convertidas.map((c) => (
          <CotacaoCard key={c.id} cotacao={c} onAtualizar={atualizar} />
        ))}
      </KanbanColumn>
    </KanbanBoard>
  );
}
