import type { Avaliacao } from "@prisma/client";
import type { AvaliacaoPublic } from "@conectaobra/types/avaliacoes";

type AvaliacaoWithRelations = Avaliacao & {
  autor: { nome: string };
  obra: { titulo: string } | null;
};

export function toPublicAvaliacao(avaliacao: AvaliacaoWithRelations): AvaliacaoPublic {
  return {
    id: avaliacao.id,
    autorNome: avaliacao.autor.nome,
    tipo: avaliacao.tipo,
    obraId: avaliacao.obraId,
    obraTitulo: avaliacao.obra?.titulo ?? null,
    nota: avaliacao.nota,
    comentario: avaliacao.comentario,
    createdAt: avaliacao.createdAt.toISOString(),
  };
}
