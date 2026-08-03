import type { ProjectCatalog } from "@prisma/client";
import type { ProjectPrivate } from "@conectaobra/types/projects-catalog";

export function toPrivateProject(project: ProjectCatalog): ProjectPrivate {
  return {
    id: project.id,
    arquitetoId: project.arquitetoId,
    titulo: project.titulo,
    categoria: project.categoria,
    precoCentavos: project.precoCentavos,
    descricao: project.descricao,
    imagemCapaUrl: project.imagemCapaUrl,
    licenca: project.licenca,
    arquivos: project.arquivos,
    vendasCount: project.vendasCount,
    createdAt: project.createdAt.toISOString(),
  };
}
