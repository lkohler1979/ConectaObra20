import { randomUUID } from "node:crypto";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type ProjectPurchase } from "@prisma/client";
import type { ProjectPurchasePublic } from "@conectaobra/types/projects-catalog";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { env } from "../../config/env";
import { toPublicPurchase } from "./project-purchase-public.mapper";
import { WatermarkService } from "./watermark.service";

/**
 * Checkout do catálogo de plantas (E9-05 parte 2) — PSP SIMULADO, mesmo
 * padrão de PurchaseOrder (E7-04): `pspRef` sempre "SIMULADO-<uuid>",
 * sucesso sempre instantâneo, comissão via `CATALOG_COMMISSION_BPS`
 * (placeholder 15–25% do PRD, não decisão fechada — P-002).
 */
@Injectable()
export class CatalogPurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly watermarkService: WatermarkService,
  ) {}

  async buy(compradorId: string, projectId: string): Promise<ProjectPurchasePublic> {
    const project = await this.prisma.projectCatalog.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException("Projeto não encontrado");
    }
    if (project.arquitetoId === compradorId) {
      throw new ConflictException("Você não pode comprar o próprio projeto");
    }

    const comprador = await this.prisma.user.findUniqueOrThrow({ where: { id: compradorId } });
    const marcaTexto = `ConectaObra — ${comprador.nome}`;

    // Watermarking envolve I/O de rede (download + upload no S3) — feito
    // FORA da $transaction abaixo pra não estourar o timeout de transação
    // interativa do Prisma.
    const arquivosEntregues: string[] = [];
    let marcaDaguaAplicada = false;
    for (const arquivoUrl of project.arquivos) {
      const resultado = await this.watermarkService.watermarkFile(arquivoUrl, marcaTexto);
      arquivosEntregues.push(resultado.url);
      if (resultado.aplicada) marcaDaguaAplicada = true;
    }

    const comissaoCentavos = Math.round(
      (project.precoCentavos * env.CATALOG_COMMISSION_BPS) / 10_000,
    );
    const pspRef = `SIMULADO-${randomUUID()}`;

    let purchase: ProjectPurchase;
    try {
      purchase = await this.prisma.$transaction(async (tx) => {
        const created = await tx.projectPurchase.create({
          data: {
            projectId,
            compradorId,
            precoCentavos: project.precoCentavos,
            comissaoCentavos,
            pspRef,
            status: "PAGO",
            arquivosEntregues,
            marcaDaguaAplicada,
          },
        });

        await tx.projectCatalog.update({
          where: { id: projectId },
          data: { vendasCount: { increment: 1 } },
        });

        return created;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Você já comprou este projeto");
      }
      throw error;
    }

    await this.auditLog.record({
      userId: compradorId,
      acao: "project_purchase.created",
      entidade: "project_purchase",
      payload: {
        purchaseId: purchase.id,
        projectId,
        comissaoCentavos,
        pspRef,
        simulado: true,
        marcaDaguaAplicada,
      },
    });

    return toPublicPurchase(purchase);
  }

  async listMine(compradorId: string): Promise<ProjectPurchasePublic[]> {
    const purchases = await this.prisma.projectPurchase.findMany({
      where: { compradorId },
      orderBy: { createdAt: "desc" },
    });
    return purchases.map(toPublicPurchase);
  }
}
