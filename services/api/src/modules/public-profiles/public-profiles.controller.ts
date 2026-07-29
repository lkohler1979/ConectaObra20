import { Controller, Get, Param } from "@nestjs/common";
import { publicProfileIdSchema } from "@conectaobra/types/public-profiles";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { PublicProfilesService } from "./public-profiles.service";

/**
 * Perfis públicos (E2-03) — primeiro controller da API sem JwtAuthGuard,
 * de propósito: visitante sem conta procurando prestador/fornecedor (SEO,
 * link compartilhado etc). Só devolve campos já filtrados como seguros no
 * PublicProfilesService — nunca e-mail/telefone/CPF-CNPJ/kycStatus.
 */
@Controller("public")
export class PublicProfilesController {
  constructor(private readonly publicProfiles: PublicProfilesService) {}

  @Get("prestadores/:id")
  getPrestador(@Param("id", new ZodValidationPipe(publicProfileIdSchema)) id: string) {
    return this.publicProfiles.getPrestador(id);
  }

  @Get("fornecedores/:id")
  getFornecedor(@Param("id", new ZodValidationPipe(publicProfileIdSchema)) id: string) {
    return this.publicProfiles.getFornecedor(id);
  }
}
