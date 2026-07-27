import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { loggerConfig } from "./common/observability/logger.config";
import { SentryExceptionFilter } from "./common/observability/sentry-exception.filter";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuditLogModule } from "./common/audit/audit-log.module";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [LoggerModule.forRoot(loggerConfig), PrismaModule, AuditLogModule],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: SentryExceptionFilter }],
})
export class AppModule {}
