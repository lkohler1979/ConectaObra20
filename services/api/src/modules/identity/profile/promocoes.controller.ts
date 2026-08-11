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
  createPromocaoInputSchema,
  promocaoIdSchema,
  updatePromocaoInputSchema,
  validarCupomInputSchema,
  type CreatePromocaoInput,
  type UpdatePromocaoInput,
  type ValidarCupomInput,
} from "@conectaobra/types/promocoes";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../../common/guards/user-type.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { PromocoesService } from "./promocoes.service";

@Controller("profile/fornecedor/promocoes")
@UseGuards(JwtAuthGuard, UserTypeGuard)
@AllowedUserTypes("FORNECEDOR")
export class PromocoesController {
  constructor(private readonly promocoesService: PromocoesService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createPromocaoInputSchema)) body: CreatePromocaoInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.promocoesService.create(user.sub, body);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.promocoesService.listMine(user.sub);
  }

  @Post("validar")
  validar(
    @Body(new ZodValidationPipe(validarCupomInputSchema)) body: ValidarCupomInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.promocoesService.validar(user.sub, body);
  }

  @Patch(":id")
  update(
    @Param("id", new ZodValidationPipe(promocaoIdSchema)) id: string,
    @Body(new ZodValidationPipe(updatePromocaoInputSchema)) body: UpdatePromocaoInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.promocoesService.update(user.sub, id, body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param("id", new ZodValidationPipe(promocaoIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.promocoesService.remove(user.sub, id);
  }
}
