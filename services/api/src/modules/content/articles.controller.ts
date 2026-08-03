import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  articleIdSchema,
  createArticleInputSchema,
  updateArticleInputSchema,
  type CreateArticleInput,
  type UpdateArticleInput,
} from "@conectaobra/types/articles";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { ArticlesService } from "./articles.service";

/** Notícias (E9-01) e biblioteca (E9-04) — cadastro exclusivo do ADMIN. */
@Controller("articles")
@UseGuards(JwtAuthGuard, UserTypeGuard)
@AllowedUserTypes("ADMIN")
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createArticleInputSchema)) body: CreateArticleInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.articlesService.create(user.sub, body);
  }

  @Get()
  list() {
    return this.articlesService.listAll();
  }

  @Patch(":id")
  update(
    @Param("id", new ZodValidationPipe(articleIdSchema)) id: string,
    @Body(new ZodValidationPipe(updateArticleInputSchema)) body: UpdateArticleInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.articlesService.update(user.sub, id, body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param("id", new ZodValidationPipe(articleIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.articlesService.remove(user.sub, id);
  }
}
