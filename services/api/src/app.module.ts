import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { loggerConfig } from "./common/observability/logger.config";
import { SentryExceptionFilter } from "./common/observability/sentry-exception.filter";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuditLogModule } from "./common/audit/audit-log.module";
import { HealthController } from "./health/health.controller";
import { AuthModule } from "./modules/identity/auth/auth.module";
import { ProfileModule } from "./modules/identity/profile/profile.module";

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    // Default global — endpoints de auth definem limites mais estritos via @Throttle().
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuditLogModule,
    AuthModule,
    ProfileModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: SentryExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
