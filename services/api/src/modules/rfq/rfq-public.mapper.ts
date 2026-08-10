import type { Rfq } from "@prisma/client";
import type { RfqPublic } from "@conectaobra/types/rfq";

export function toPublicRfq(rfq: Rfq): RfqPublic {
  return {
    id: rfq.id,
    obraId: rfq.obraId,
    clienteId: rfq.clienteId,
    categoria: rfq.categoria,
    descricao: rfq.descricao,
    fotos: rfq.fotos,
    prazoResposta: rfq.prazoResposta ? rfq.prazoResposta.toISOString() : null,
    regiao: rfq.regiao,
    status: rfq.status,
    materialListId: rfq.materialListId,
    createdAt: rfq.createdAt.toISOString(),
  };
}
