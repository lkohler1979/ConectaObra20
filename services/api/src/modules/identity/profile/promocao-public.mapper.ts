import type { Promocao } from "@prisma/client";
import type { PromocaoPrivate } from "@conectaobra/types/promocoes";

export function toPrivatePromocao(promocao: Promocao): PromocaoPrivate {
  return {
    id: promocao.id,
    fornecedorId: promocao.fornecedorId,
    codigo: promocao.codigo,
    nome: promocao.nome,
    descricao: promocao.descricao,
    valorOriginalCentavos: promocao.valorOriginalCentavos,
    valorPromocionalCentavos: promocao.valorPromocionalCentavos,
    imagemUrl: promocao.imagemUrl,
    validadeInicio: promocao.validadeInicio ? promocao.validadeInicio.toISOString() : null,
    validadeFim: promocao.validadeFim.toISOString(),
    destaque: promocao.destaque,
    ativa: promocao.ativa,
    createdAt: promocao.createdAt.toISOString(),
    updatedAt: promocao.updatedAt.toISOString(),
  };
}
