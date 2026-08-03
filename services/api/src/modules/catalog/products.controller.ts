import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import {
  createProductInputSchema,
  productIdSchema,
  updateProductInputSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "@conectaobra/types/catalog";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { ProductsService } from "./products.service";

const ALLOWED_SPREADSHEET_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
];
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

@Controller("products")
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("FORNECEDOR")
  create(
    @Body(new ZodValidationPipe(createProductInputSchema)) body: CreateProductInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.create(user.sub, body);
  }

  @Post("import")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("FORNECEDOR")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_IMPORT_BYTES } }))
  importFromExcel(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException("Nenhum arquivo enviado (campo \"file\")");
    }
    if (!ALLOWED_SPREADSHEET_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException("Arquivo precisa ser uma planilha Excel (.xlsx ou .xls)");
    }
    return this.productsService.importFromExcel(user.sub, file.buffer);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.productsService.listMine(user.sub);
  }

  @Get(":id")
  getOne(
    @Param("id", new ZodValidationPipe(productIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.getMine(user.sub, id);
  }

  @Patch(":id")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("FORNECEDOR")
  update(
    @Param("id", new ZodValidationPipe(productIdSchema)) id: string,
    @Body(new ZodValidationPipe(updateProductInputSchema)) body: UpdateProductInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.update(user.sub, id, body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("FORNECEDOR")
  remove(
    @Param("id", new ZodValidationPipe(productIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.remove(user.sub, id);
  }
}
