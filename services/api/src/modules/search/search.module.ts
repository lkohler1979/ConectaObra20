import { Module } from "@nestjs/common";
import { SearchController } from "./search.controller";
import { MeilisearchService } from "./meilisearch.service";

@Module({
  controllers: [SearchController],
  providers: [MeilisearchService],
  exports: [MeilisearchService],
})
export class SearchModule {}
