import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { BullModule } from "@nestjs/bullmq";
import { Redis } from "ioredis";
import { LoggerModule } from "nestjs-pino";
import { loggerConfig } from "./common/observability/logger.config";
import { SentryExceptionFilter } from "./common/observability/sentry-exception.filter";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuditLogModule } from "./common/audit/audit-log.module";
import { env } from "./config/env";
import { HealthController } from "./health/health.controller";
import { AccountModule } from "./modules/identity/account/account.module";
import { AuthModule } from "./modules/identity/auth/auth.module";
import { ProfileModule } from "./modules/identity/profile/profile.module";
import { MediaModule } from "./modules/media/media.module";
import { WorksModule } from "./modules/works/works.module";
import { RfqModule } from "./modules/rfq/rfq.module";
import { ContractsModule } from "./modules/contracts/contracts.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    // Default global — endpoints de auth definem limites mais estritos via @Throttle().
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    // maxRetriesPerRequest: null é exigido pelo BullMQ pra conexões usadas por workers.
    BullModule.forRoot({
      connection: new Redis(env.REDIS_URL, { maxRetriesPerRequest: null }),
    }),
    PrismaModule,
    AuditLogModule,
    AuthModule,
    ProfileModule,
    MediaModule,
    AccountModule,
    WorksModule,
    RfqModule,
    ContractsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: SentryExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
