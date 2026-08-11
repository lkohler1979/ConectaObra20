import type { FornecedorLoja } from "@prisma/client";
import type { FornecedorLojaPublic } from "@conectaobra/types/fornecedor-lojas";

export function toPublicLoja(loja: FornecedorLoja): FornecedorLojaPublic {
  return {
    id: loja.id,
    fornecedorId: loja.fornecedorId,
    nome: loja.nome,
    endereco: loja.endereco,
    regiao: loja.regiao,
    telefone: loja.telefone,
    imagemUrl: loja.imagemUrl,
    createdAt: loja.createdAt.toISOString(),
  };
}
