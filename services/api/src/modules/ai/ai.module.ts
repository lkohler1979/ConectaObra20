import { Module } from "@nestjs/common";
import { CalculatorsController } from "./calculators.controller";
import { CalculatorsService } from "./calculators.service";
import { KnowledgeController } from "./knowledge.controller";
import { KnowledgeService } from "./knowledge.service";

@Module({
  controllers: [CalculatorsController, KnowledgeController],
  providers: [CalculatorsService, KnowledgeService],
})
export class AiModule {}
