import type { Avaliacao } from "@prisma/client";
import type { AvaliacaoAdmin } from "@conectaobra/types/avaliacoes";

type AvaliacaoWithRelations = Avaliacao & {
  autor: { nome: string; email: string };
  prestador: { nome: string } | null;
  fornecedor: { nome: string } | null;
  produto: { nome: string } | null;
  obra: { titulo: string } | null;
};

export function toAdminAvaliacao(avaliacao: AvaliacaoWithRelations): AvaliacaoAdmin {
  return {
    id: avaliacao.id,
    tipo: avaliacao.tipo,
    autorNome: avaliacao.autor.nome,
    autorEmail: avaliacao.autor.email,
    prestadorNome: avaliacao.prestador?.nome ?? null,
    fornecedorNome: avaliacao.fornecedor?.nome ?? null,
    produtoNome: avaliacao.produto?.nome ?? null,
    obraTitulo: avaliacao.obra?.titulo ?? null,
    nota: avaliacao.nota,
    comentario: avaliacao.comentario,
    oculta: avaliacao.oculta,
    ocultaMotivo: avaliacao.ocultaMotivo,
    ocultaEm: avaliacao.ocultaEm?.toISOString() ?? null,
    createdAt: avaliacao.createdAt.toISOString(),
  };
}
