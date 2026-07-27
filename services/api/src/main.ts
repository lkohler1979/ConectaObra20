import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { initSentry } from "./common/observability/sentry";
import { env } from "./config/env";
import { AppModule } from "./app.module";

async function bootstrap() {
  initSentry();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  await app.listen(env.PORT);
}

bootstrap();
