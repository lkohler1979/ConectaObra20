import { Injectable, NotFoundException } from "@nestjs/common";
import type { ListPublicProjectsQuery, ProjectPublic } from "@conectaobra/types/projects-catalog";
import { PrismaService } from "../../common/prisma/prisma.service";

/**
 * Vitrine pública (sem login) do catálogo de plantas (E9-05) — nunca expõe
 * `arquivos` (conteúdo pago, só libera após a compra).
 */
@Injectable()
export class PublicCatalogProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPublicProjectsQuery): Promise<ProjectPublic[]> {
    const projects = await this.prisma.projectCatalog.findMany({
      where: query.categoria ? { categoria: query.categoria } : undefined,
      include: { arquiteto: { select: { nome: true } } },
      orderBy: { createdAt: "desc" },
      take: query.limit,
    });

    return projects.map((project) => ({
      id: project.id,
      arquitetoId: project.arquitetoId,
      arquitetoNome: project.arquiteto.nome,
      titulo: project.titulo,
      categoria: project.categoria,
      precoCentavos: project.precoCentavos,
      descricao: project.descricao,
      imagemCapaUrl: project.imagemCapaUrl,
      licenca: project.licenca,
      vendasCount: project.vendasCount,
      createdAt: project.createdAt.toISOString(),
    }));
  }

  async getById(id: string): Promise<ProjectPublic> {
    const project = await this.prisma.projectCatalog.findUnique({
      where: { id },
      include: { arquiteto: { select: { nome: true } } },
    });

    if (!project) {
      throw new NotFoundException("Projeto não encontrado");
    }

    return {
      id: project.id,
      arquitetoId: project.arquitetoId,
      arquitetoNome: project.arquiteto.nome,
      titulo: project.titulo,
      categoria: project.categoria,
      precoCentavos: project.precoCentavos,
      descricao: project.descricao,
      imagemCapaUrl: project.imagemCapaUrl,
      licenca: project.licenca,
      vendasCount: project.vendasCount,
      createdAt: project.createdAt.toISOString(),
    };
  }
}
