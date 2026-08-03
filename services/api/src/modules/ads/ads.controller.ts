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
  adIdSchema,
  createAdInputSchema,
  updateAdInputSchema,
  type CreateAdInput,
  type UpdateAdInput,
} from "@conectaobra/types/ads";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { CurrentUser } from "../identity/auth/current-user.decorator";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../identity/auth/strategies/jwt.strategy";
import { AdsService } from "./ads.service";

@Controller("ads")
@UseGuards(JwtAuthGuard, UserTypeGuard)
@AllowedUserTypes("FORNECEDOR", "PRESTADOR", "TECNICO")
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createAdInputSchema)) body: CreateAdInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adsService.create(user.sub, body);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.adsService.listMine(user.sub);
  }

  @Patch(":id")
  update(
    @Param("id", new ZodValidationPipe(adIdSchema)) id: string,
    @Body(new ZodValidationPipe(updateAdInputSchema)) body: UpdateAdInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adsService.update(user.sub, id, body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param("id", new ZodValidationPipe(adIdSchema)) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adsService.remove(user.sub, id);
  }
}
