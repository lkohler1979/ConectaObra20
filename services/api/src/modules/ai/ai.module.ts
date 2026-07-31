import { Module } from "@nestjs/common";
import { CalculatorsController } from "./calculators.controller";
import { CalculatorsService } from "./calculators.service";
import { KnowledgeController } from "./knowledge.controller";
import { KnowledgeService } from "./knowledge.service";
import { ChatController } from "./chat.controller";
import { AiChatService } from "./chat.service";

@Module({
  controllers: [CalculatorsController, KnowledgeController, ChatController],
  providers: [CalculatorsService, KnowledgeService, AiChatService],
})
export class AiModule {}
