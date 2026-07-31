import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  analisarOrcamentoInputSchema,
  upsertAvgCostInputSchema,
  type AnalisarOrcamentoInput,
  type UpsertAvgCostInput,
} from "@conectaobra/types/ai-budget";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AllowedUserTypes } from "../../common/decorators/allowed-user-types.decorator";
import { UserTypeGuard } from "../../common/guards/user-type.guard";
import { JwtAuthGuard } from "../identity/auth/guards/jwt-auth.guard";
import { BudgetAnalyzerService } from "./budget-analyzer.service";

/** Análise de orçamento (E5-05) — comparação determinística vs. custo médio regional. */
@Controller("ai")
@UseGuards(JwtAuthGuard)
export class BudgetAnalyzerController {
  constructor(private readonly budgetAnalyzerService: BudgetAnalyzerService) {}

  /** Cadastro do custo médio — exclusivo do ADMIN, sem fonte real (SINAPI/CUB) integrada ainda. */
  @Post("avg-costs")
  @UseGuards(UserTypeGuard)
  @AllowedUserTypes("ADMIN")
  upsertAvgCost(@Body(new ZodValidationPipe(upsertAvgCostInputSchema)) body: UpsertAvgCostInput) {
    return this.budgetAnalyzerService.upsertAvgCost(body);
  }

  @Post("analisar-orcamento")
  analisar(@Body(new ZodValidationPipe(analisarOrcamentoInputSchema)) body: AnalisarOrcamentoInput) {
    return this.budgetAnalyzerService.analisar(body);
  }
}
