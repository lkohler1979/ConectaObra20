import { Controller, Get, Param, Query } from "@nestjs/common";
import {
  listPublicProjectsQuerySchema,
  projectIdSchema,
  type ListPublicProjectsQuery,
} from "@conectaobra/types/projects-catalog";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { PublicCatalogProjectsService } from "./public-catalog-projects.service";

/** Catálogo de plantas (E9-05) — vitrine pública, sem login. */
@Controller("public/catalog/projects")
export class PublicCatalogProjectsController {
  constructor(private readonly publicCatalogProjects: PublicCatalogProjectsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(listPublicProjectsQuerySchema)) query: ListPublicProjectsQuery,
  ) {
    return this.publicCatalogProjects.list(query);
  }

  @Get(":id")
  getById(@Param("id", new ZodValidationPipe(projectIdSchema)) id: string) {
    return this.publicCatalogProjects.getById(id);
  }
}
