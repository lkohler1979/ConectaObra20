import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { CreateReviewInput, ReviewPublic } from "@conectaobra/types/reviews";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { MeilisearchService } from "../search/meilisearch.service";
import { toPublicReview } from "./review-public.mapper";

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly meilisearch: MeilisearchService,
  ) {}

  /**
   * `avaliadoId` nunca vem do cliente — é sempre a outra parte do contrato,
   * descoberta aqui. Exige pelo menos 1 milestone `APROVADO` OU `PAGO` no
   * contrato (E6-01) — sem isso, não há sinal de que algum trabalho foi de
   * fato entregue e aceito (resolve a limitação registrada em
   * PENDENCIAS.md P-036). `PAGO` entra aqui porque o escrow simulado (E4)
   * agora libera automaticamente e avança o status pra `PAGO` — sem incluir
   * esse estado, contratos com etapas já liberadas parariam de contar pro
   * gate, o oposto do que deveria acontecer.
   */
  async create(
    contratoId: string,
    avaliadorId: string,
    input: CreateReviewInput,
  ): Promise<ReviewPublic> {
    const { avaliador, avaliado } = await this.resolveParties(contratoId, avaliadorId);

    const milestonesAprovados = await this.prisma.milestone.count({
      where: { contractId: contratoId, status: { in: ["APROVADO", "PAGO"] } },
    });
    if (milestonesAprovados === 0) {
      throw new ConflictException(
        "Este contrato ainda não tem nenhuma etapa aprovada — avalie depois que ao menos uma entrega for aprovada",
      );
    }

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
      obraId: await this.getObraId(contratoId),
      acao: "review.created",
      entidade: "review",
      payload: { reviewId: review.id, contratoId },
    });

    await this.recalcularNotaMedia(avaliado);

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

  /** Alimenta o diário de obra (E6-03) — Review não tem obraId direto, só via Contract. */
  private async getObraId(contratoId: string): Promise<string | undefined> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contratoId },
      select: { obraId: true },
    });
    return contract?.obraId;
  }

  /**
   * Média simples das 3 notas (prazo/qualidade/preço) de todas as reviews já
   * recebidas, gravada em `ProfilePrestador.notaMedia`/`ProfileFornecedor.
   * notaMedia` (E2-05). `updateMany` é seguro mesmo sem o perfil correspondente
   * — o avaliado pode ser um CLIENTE, que não tem nenhum dos dois (User não
   * guarda nota própria; ver PENDENCIAS.md).
   */
  private async recalcularNotaMedia(avaliadoId: string): Promise<void> {
    const agg = await this.prisma.review.aggregate({
      where: { avaliadoId },
      _avg: { notaPrazo: true, notaQualidade: true, notaPreco: true },
    });

    const medias = [agg._avg.notaPrazo, agg._avg.notaQualidade, agg._avg.notaPreco].filter(
      (n): n is number => n !== null,
    );
    if (medias.length === 0) return;

    const notaMedia = medias.reduce((a, b) => a + b, 0) / medias.length;

    const prestadorAtualizado = await this.prisma.profilePrestador.updateMany({
      where: { userId: avaliadoId },
      data: { notaMedia },
    });
    const fornecedorAtualizado = await this.prisma.profileFornecedor.updateMany({
      where: { userId: avaliadoId },
      data: { notaMedia },
    });

    // Só atualiza o índice do Meilisearch que corresponde a um profile que
    // de fato existe — `updateDocuments` faz upsert, então chamar os dois
    // incondicionalmente (bug encontrado em produção) cria um documento
    // fantasma (só {userId, notaMedia}) no índice errado pra avaliados
    // CLIENTE (sem nenhum profile) ou só PRESTADOR/só FORNECEDOR.
    if (prestadorAtualizado.count > 0) {
      await this.meilisearch.updatePrestadorNota(avaliadoId, notaMedia);
    }
    if (fornecedorAtualizado.count > 0) {
      await this.meilisearch.updateFornecedorNota(avaliadoId, notaMedia);
    }
  }
}
