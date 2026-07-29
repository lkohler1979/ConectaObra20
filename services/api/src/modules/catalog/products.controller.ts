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
