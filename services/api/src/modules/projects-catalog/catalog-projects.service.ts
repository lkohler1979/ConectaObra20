import { Injectable, NotFoundException } from "@nestjs/common";
import type { ProjectCatalog } from "@prisma/client";
import type {
  CreateProjectInput,
  ProjectPrivate,
  UpdateProjectInput,
} from "@conectaobra/types/projects-catalog";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { toPrivateProject } from "./catalog-project-public.mapper";

/** Catálogo de plantas (E9-05) — CRUD restrito ao arquiteto/técnico dono. */
@Injectable()
export class CatalogProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(arquitetoId: string, input: CreateProjectInput): Promise<ProjectPrivate> {
    const project = await this.prisma.projectCatalog.create({
      data: {
        arquitetoId,
        titulo: input.titulo,
        categoria: input.categoria,
        precoCentavos: input.precoCentavos,
        descricao: input.descricao,
        imagemCapaUrl: input.imagemCapaUrl,
        licenca: input.licenca,
        arquivos: input.arquivos,
      },
    });

    await this.auditLog.record({
      userId: arquitetoId,
      acao: "project_catalog.created",
      entidade: "project_catalog",
      payload: { projectId: project.id, titulo: project.titulo },
    });

    return toPrivateProject(project);
  }

  async listMine(arquitetoId: string): Promise<ProjectPrivate[]> {
    const projects = await this.prisma.projectCatalog.findMany({
      where: { arquitetoId },
      orderBy: { createdAt: "desc" },
    });
    return projects.map(toPrivateProject);
  }

  async update(
    arquitetoId: string,
    projectId: string,
    input: UpdateProjectInput,
  ): Promise<ProjectPrivate> {
    await this.getOwnedOrThrow(arquitetoId, projectId);

    const project = await this.prisma.projectCatalog.update({
      where: { id: projectId },
      data: {
        titulo: input.titulo,
        categoria: input.categoria,
        precoCentavos: input.precoCentavos,
        descricao: input.descricao,
        imagemCapaUrl: input.imagemCapaUrl,
        licenca: input.licenca,
        arquivos: input.arquivos,
      },
    });

    await this.auditLog.record({
      userId: arquitetoId,
      acao: "project_catalog.updated",
      entidade: "project_catalog",
      payload: { projectId },
    });

    return toPrivateProject(project);
  }

  async remove(arquitetoId: string, projectId: string): Promise<void> {
    await this.getOwnedOrThrow(arquitetoId, projectId);

    await this.prisma.projectCatalog.delete({ where: { id: projectId } });

    await this.auditLog.record({
      userId: arquitetoId,
      acao: "project_catalog.deleted",
      entidade: "project_catalog",
      payload: { projectId },
    });
  }

  /** Não vaza se o projeto existe e é de outro arquiteto — 404 nos dois casos. */
  private async getOwnedOrThrow(
    arquitetoId: string,
    projectId: string,
  ): Promise<ProjectCatalog> {
    const project = await this.prisma.projectCatalog.findUnique({ where: { id: projectId } });
    if (!project || project.arquitetoId !== arquitetoId) {
      throw new NotFoundException("Projeto não encontrado");
    }
    return project;
  }
}
