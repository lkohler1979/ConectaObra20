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
  createFornecedorLojaInputSchema,
  fornecedorLojaIdSchema,
  updateFornecedorLojaInputSchema,
  type CreateFornecedorLojaInput,
  type UpdateFornecedorLojaInput,
} from "@conectaobra/types/fornecedor-lojas";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../../common/guards/user-type.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { LojasService } from "./lojas.service";

@Controller("profile/fornecedor/lojas")
@UseGuards(JwtAuthGuard, UserTypeGuard)
@AllowedUserTypes("FORNECEDOR")
export class LojasController {
  constructor(private readonly lojasService: LojasService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createFornecedorLojaInputSchema)) body: CreateFornecedorLojaInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lojasService.create(user.sub, body);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.lojasService.listMine(user.sub);
  }

  @Patch(":id")
  update(
    @Param("id", new ZodValidationPipe(fornecedorLojaIdSchema)) id: string,
    @Body(new ZodValidationPipe(updateFornecedorLojaInputSchema)) body: UpdateFornecedorLojaInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lojasService.update(user.sub, id, body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param("id", new ZodValidationPipe(fornecedorLojaIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lojasService.remove(user.sub, id);
  }
}
