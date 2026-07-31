import { Module } from "@nestjs/common";
import { CalculatorsController } from "./calculators.controller";
import { CalculatorsService } from "./calculators.service";
import { KnowledgeController } from "./knowledge.controller";
import { KnowledgeService } from "./knowledge.service";
import { ChatController } from "./chat.controller";
import { AiChatService } from "./chat.service";
import { BudgetAnalyzerController } from "./budget-analyzer.controller";
import { BudgetAnalyzerService } from "./budget-analyzer.service";
import { MaterialGeneratorService } from "./material-generator.service";

@Module({
  controllers: [
    CalculatorsController,
    KnowledgeController,
    ChatController,
    BudgetAnalyzerController,
  ],
  providers: [
    CalculatorsService,
    KnowledgeService,
    AiChatService,
    BudgetAnalyzerService,
    MaterialGeneratorService,
  ],
  exports: [MaterialGeneratorService],
})
export class AiModule {}
