import type { AvaliacaoListResponse, AvaliacaoPublic } from "@conectaobra/types/avaliacoes";
import { Badge, Card, CardContent } from "@conectaobra/ui";

function Resumo({ resumo }: { resumo: AvaliacaoListResponse["resumo"] }) {
  return (
    <div className="flex items-center gap-2 text-sm text-grafite">
      {resumo.notaMedia !== null ? (
        <>
          <Badge variant="verified">★ {resumo.notaMedia.toFixed(1)}</Badge>
          <span className="text-[#7A828C]">
            {resumo.total} avaliaç{resumo.total === 1 ? "ão" : "ões"} da comunidade
          </span>
        </>
      ) : (
        <span className="text-[#7A828C]">Nenhuma avaliação da comunidade ainda</span>
      )}
    </div>
  );
}

function ItemCard({ item }: { item: AvaliacaoPublic }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-grafite">{item.autorNome}</p>
          <Badge variant="verified">★ {item.nota}</Badge>
        </div>
        {item.comentario && <p className="mt-1 text-sm text-grafite/80">{item.comentario}</p>}
        <p className="mt-1 text-xs text-[#7A828C]">
          {new Date(item.createdAt).toLocaleDateString("pt-BR")}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Avaliação/comentário aberto (não exige contrato) — mostra o resumo
 * ("de forma geral") e, opcionalmente, a lista agrupada por obra.
 */
export function AvaliacoesLista({
  data,
  agruparPorObra = false,
}: {
  data: AvaliacaoListResponse;
  agruparPorObra?: boolean;
}) {
  const { resumo, itens } = data;

  if (!agruparPorObra) {
    return (
      <div className="flex flex-col gap-4">
        <Resumo resumo={resumo} />
        {itens.length === 0 ? (
          <p className="text-sm text-[#5B6875]">Nenhuma avaliação ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {itens.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const porObra = new Map<string, AvaliacaoPublic[]>();
  for (const item of itens) {
    const chave = item.obraTitulo ?? "Sem obra";
    porObra.set(chave, [...(porObra.get(chave) ?? []), item]);
  }

  return (
    <div className="flex flex-col gap-4">
      <Resumo resumo={resumo} />
      {itens.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhuma avaliação ainda.</p>
      ) : (
        [...porObra.entries()].map(([obraTitulo, obraItens]) => (
          <div key={obraTitulo}>
            <h3 className="text-sm font-bold text-grafite">{obraTitulo}</h3>
            <div className="mt-2 flex flex-col gap-2">
              {obraItens.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
