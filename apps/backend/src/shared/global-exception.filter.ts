import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const body =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    if (typeof body === "object" && body && "code" in body && "message" in body) {
      response.status(status).json({ ok: false, error: body });
      return;
    }

    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message: unknown }).message)
        : exception instanceof Error
          ? exception.message
          : "Erro interno.";

    response.status(status).json({
      ok: false,
      error: {
        code: status === 500 ? "internal_error" : "request_error",
        message,
      },
    });
  }
}
