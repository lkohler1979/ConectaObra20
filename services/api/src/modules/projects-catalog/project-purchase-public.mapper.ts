import type { ProjectPurchase } from "@prisma/client";
import type { ProjectPurchasePublic } from "@conectaobra/types/projects-catalog";

export function toPublicPurchase(purchase: ProjectPurchase): ProjectPurchasePublic {
  return {
    id: purchase.id,
    projectId: purchase.projectId,
    compradorId: purchase.compradorId,
    precoCentavos: purchase.precoCentavos,
    comissaoCentavos: purchase.comissaoCentavos,
    pspRef: purchase.pspRef,
    status: purchase.status,
    arquivosEntregues: purchase.arquivosEntregues,
    marcaDaguaAplicada: purchase.marcaDaguaAplicada,
    createdAt: purchase.createdAt.toISOString(),
  };
}
