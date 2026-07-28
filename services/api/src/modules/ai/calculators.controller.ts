import { Body, Controller, Post } from "@nestjs/common";
import {
  argamassaInputSchema,
  blocosInputSchema,
  concretoInputSchema,
  tintaInputSchema,
  type ArgamassaInput,
  type BlocosInput,
  type ConcretoInput,
  type TintaInput,
} from "@conectaobra/types/ai-calc";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CalculatorsService } from "./calculators.service";

/**
 * Ferramentas determinísticas do "Engenheiro Virtual" (E5-04) — hoje só
 * expostas como REST, prontas pra virar tools de um agente quando o chat
 * (E5-03) existir. Endpoints públicos: são cálculos sem estado nem dado
 * sensível, cobertos pelo rate-limit global (ThrottlerModule).
 */
@Controller("ai/calc")
export class CalculatorsController {
  constructor(private readonly calculators: CalculatorsService) {}

  @Post("concreto")
  concreto(@Body(new ZodValidationPipe(concretoInputSchema)) body: ConcretoInput) {
    return this.calculators.concreto(body);
  }

  @Post("blocos")
  blocos(@Body(new ZodValidationPipe(blocosInputSchema)) body: BlocosInput) {
    return this.calculators.blocos(body);
  }

  @Post("argamassa")
  argamassa(@Body(new ZodValidationPipe(argamassaInputSchema)) body: ArgamassaInput) {
    return this.calculators.argamassa(body);
  }

  @Post("tinta")
  tinta(@Body(new ZodValidationPipe(tintaInputSchema)) body: TintaInput) {
    return this.calculators.tinta(body);
  }
}
