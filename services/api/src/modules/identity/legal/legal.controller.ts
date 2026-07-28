import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import {
  recordConsentInputSchema,
  type LegalVersions,
  type RecordConsentInput,
} from "@conectaobra/types/legal";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { ConsentService } from "./consent.service";
import { CURRENT_LEGAL_VERSION } from "./legal-versions";

@Controller("legal")
export class LegalController {
  constructor(private readonly consentService: ConsentService) {}

  /** Público — o client precisa saber a versão antes de mostrar o checkbox de cadastro. */
  @Get("versions")
  getVersions(): LegalVersions {
    return { versao: CURRENT_LEGAL_VERSION };
  }

  /**
   * Só COMUNICACAO_MARKETING pode ser mudado por aqui — TERMOS_USO e
   * POLITICA_PRIVACIDADE são obrigatórios e só se registram no cadastro
   * (ver AuthService.register + ConsentService.recordMandatoryOnRegister).
   */
  @Post("consent")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async recordConsent(
    @Body(new ZodValidationPipe(recordConsentInputSchema)) body: RecordConsentInput,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.consentService.record(user.sub, body.tipo, body.aceito);
  }
}
