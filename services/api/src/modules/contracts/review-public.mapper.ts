import type { Review } from "@prisma/client";
import type { ReviewPublic } from "@conectaobra/types/reviews";

export function toPublicReview(review: Review): ReviewPublic {
  return {
    id: review.id,
    contratoId: review.contratoId,
    avaliadorId: review.avaliadorId,
    avaliadoId: review.avaliadoId,
    notaPrazo: review.notaPrazo,
    notaQualidade: review.notaQualidade,
    notaPreco: review.notaPreco,
    comentario: review.comentario,
    createdAt: review.createdAt.toISOString(),
  };
}
