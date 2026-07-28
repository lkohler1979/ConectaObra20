import type { Work } from "@prisma/client";
import type { WorkPublic } from "@conectaobra/types/works";

export function toPublicWork(work: Work): WorkPublic {
  return {
    id: work.id,
    clienteId: work.clienteId,
    titulo: work.titulo,
    tipo: work.tipo,
    endereco: work.endereco,
    areaM2: work.areaM2 ? work.areaM2.toNumber() : null,
    orcamentoPrevistoCentavos: work.orcamentoPrevistoCentavos,
    status: work.status,
    createdAt: work.createdAt.toISOString(),
  };
}
