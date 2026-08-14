import { Module } from "@nestjs/common";
import { SinapiController } from "./sinapi.controller";
import { SinapiCacheService } from "./sinapi-cache.service";

@Module({
  controllers: [SinapiController],
  providers: [SinapiCacheService],
})
export class SinapiModule {}
