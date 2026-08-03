import { Controller, Get, Param, Query } from "@nestjs/common";
import {
  articleSlugSchema,
  listPublicArticlesQuerySchema,
  type ListPublicArticlesQuery,
} from "@conectaobra/types/articles";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { PublicArticlesService } from "./public-articles.service";

/** Portal de notícias (E9-01) e biblioteca (E9-04) — sem login. */
@Controller("public/articles")
export class PublicArticlesController {
  constructor(private readonly publicArticles: PublicArticlesService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(listPublicArticlesQuerySchema)) query: ListPublicArticlesQuery,
  ) {
    return this.publicArticles.list(query);
  }

  @Get(":slug")
  getBySlug(@Param("slug", new ZodValidationPipe(articleSlugSchema)) slug: string) {
    return this.publicArticles.getBySlug(slug);
  }
}
