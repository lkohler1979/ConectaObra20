import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { CreateReviewInput, ReviewPublic } from "@conectaobra/types/reviews";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { toPublicReview } from "./review-public.mapper";

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * `avaliadoId` nunca vem do cliente — é sempre a outra parte do contrato,
   * descoberta aqui. Hoje qualquer contrato existente permite avaliação
   * (não há um status "concluído" definido — isso é E6, gestão de obra);
   * registrado como limitação conhecida (ver PENDENCIAS.md P-036).
   */
  async create(
    contratoId: string,
    avaliadorId: string,
    input: CreateReviewInput,
  ): Promise<ReviewPublic> {
    const { avaliador, avaliado } = await this.resolveParties(contratoId, avaliadorId);

    let review;
    try {
      review = await this.prisma.review.create({
        data: {
          contratoId,
          avaliadorId: avaliador,
          avaliadoId: avaliado,
          notaPrazo: input.notaPrazo,
          notaQualidade: input.notaQualidade,
          notaPreco: input.notaPreco,
          comentario: input.comentario,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Você já avaliou este contrato");
      }
      throw err;
    }

    await this.auditLog.record({
      userId: avaliadorId,
      acao: "review.created",
      entidade: "review",
      payload: { reviewId: review.id, contratoId },
    });

    return toPublicReview(review);
  }

  async listForContract(contratoId: string, requesterId: string): Promise<ReviewPublic[]> {
    const parties = await this.prisma.contractParty.findMany({
      where: { contractId: contratoId },
    });
    if (!parties.some((p) => p.userId === requesterId)) {
      throw new NotFoundException("Contrato não encontrado");
    }

    const reviews = await this.prisma.review.findMany({
      where: { contratoId },
      orderBy: { createdAt: "desc" },
    });
    return reviews.map(toPublicReview);
  }

  async listReceivedByMe(userId: string): Promise<ReviewPublic[]> {
    const reviews = await this.prisma.review.findMany({
      where: { avaliadoId: userId },
      orderBy: { createdAt: "desc" },
    });
    return reviews.map(toPublicReview);
  }

  /** Não vaza se o contrato existe e eu não sou parte dele — 404 nos dois casos. */
  private async resolveParties(
    contratoId: string,
    avaliadorId: string,
  ): Promise<{ avaliador: string; avaliado: string }> {
    const parties = await this.prisma.contractParty.findMany({
      where: { contractId: contratoId },
    });

    const eu = parties.find((p) => p.userId === avaliadorId);
    if (!eu) {
      throw new NotFoundException("Contrato não encontrado");
    }

    const outraParte = parties.find((p) => p.userId !== avaliadorId);
    if (!outraParte) {
      throw new ConflictException("Este contrato ainda não tem a outra parte definida");
    }

    return { avaliador: avaliadorId, avaliado: outraParte.userId };
  }
}
