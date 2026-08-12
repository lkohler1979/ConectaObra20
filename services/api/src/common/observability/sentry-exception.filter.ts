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

    // `exception.getResponse()` de um HttpException padrão do Nest já é o
    // corpo completo (`{statusCode, message, error}`) — embrulhar isso de
    // novo dentro de outro `message` (bug encontrado nesta sessão) fazia
    // `data.message` virar um objeto em vez de string em TODO formulário do
    // app, caindo sempre no texto genérico de fallback em vez da mensagem
    // real do backend.
    const body = isHttpException
      ? exception.getResponse()
      : { statusCode: status, message: "Erro interno inesperado" };

    response
      .status(status)
      .json(typeof body === "string" ? { statusCode: status, message: body } : body);
  }
}
