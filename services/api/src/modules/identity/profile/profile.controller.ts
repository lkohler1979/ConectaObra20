import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import {
  fornecedorProfileInputSchema,
  prestadorProfileInputSchema,
  type FornecedorProfileInput,
  type PrestadorProfileInput,
} from "@conectaobra/types/profile";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../../common/guards/user-type.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { ProfileService } from "./profile.service";

@Controller("profile")
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get("me")
  getMe(@CurrentUser() user: JwtPayload) {
    return this.profileService.getMe(user.sub);
  }

  /** Também usado por TECNICO — profiles_prestador cobre os dois (ver profile.ts nos types). */
  @Put("prestador")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("PRESTADOR", "TECNICO")
  updatePrestador(
    @Body(new ZodValidationPipe(prestadorProfileInputSchema))
    body: PrestadorProfileInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.profileService.upsertPrestador(user.sub, body);
  }

  @Put("fornecedor")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("FORNECEDOR")
  updateFornecedor(
    @Body(new ZodValidationPipe(fornecedorProfileInputSchema))
    body: FornecedorProfileInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.profileService.upsertFornecedor(user.sub, body);
  }
}
