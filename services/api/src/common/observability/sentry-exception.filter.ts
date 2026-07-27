import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";
import * as Sentry from "@sentry/node";
import { PinoLogger } from "nestjs-pino";

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(SentryExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Erros de negócio (4xx) não vão para o Sentry — só falhas inesperadas (5xx).
    if (!isHttpException || status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      Sentry.captureException(exception);
      this.logger.error({ err: exception }, "unhandled_exception");
    }

    const message = isHttpException
      ? exception.getResponse()
      : "Erro interno inesperado";

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
