import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import { initSentry } from "./common/observability/sentry";
import { env } from "./config/env";
import { AppModule } from "./app.module";

async function bootstrap() {
  initSentry();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.use(helmet());

  // Atrás do Nginx (DEPLOY.md) — sem isso, req.ip/rate-limit/audit_log
  // enxergariam sempre o IP do proxy, não o do cliente de verdade.
  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  await app.listen(env.PORT);
}

bootstrap();
