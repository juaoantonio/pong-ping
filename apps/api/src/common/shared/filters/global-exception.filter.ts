import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { mapPostgresError } from "../db/postgres-error.mapper";
import { APP_ERROR_CODE } from "../errors/app-error-code.enum";
import type { AppErrorCode } from "../errors/app-error-code.enum";
import { AppException } from "../errors/app.exception";
import type { ApiErrorResponse } from "../http/api-response.types";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const normalized = this.normalize(exception);

    const body: ApiErrorResponse = {
      ok: false,
      error: {
        status: normalized.status,
        code: normalized.code,
        message: normalized.message,
        details: normalized.details,
        path: request.path,
        method: request.method,
        requestId: request.requestId,
        timestamp: new Date().toISOString(),
      },
    };

    response.status(normalized.status).json(body);
  }

  private normalize(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details: unknown[];
  } {
    const mappedPostgres = mapPostgresError(exception);
    if (mappedPostgres) return this.normalize(mappedPostgres);

    if (exception instanceof AppException) {
      const response = exception.getResponse() as {
        message?: string;
        details?: unknown[];
      };
      return {
        status: exception.getStatus(),
        code: exception.code,
        message: response.message ?? exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const body =
        typeof response === "string"
          ? { message: response }
          : (response as Record<string, unknown>);
      return {
        status: exception.getStatus(),
        code: this.codeForStatus(exception.getStatus()),
        message: Array.isArray(body.message)
          ? "Request validation failed."
          : String(body.message ?? exception.message),
        details: Array.isArray(body.message) ? body.message : [],
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: APP_ERROR_CODE.InternalError,
      message: "An unexpected error occurred.",
      details: [],
    };
  }

  private codeForStatus(status: number): AppErrorCode {
    if (status === HttpStatus.NOT_FOUND) return APP_ERROR_CODE.NotFound;
    if (status === HttpStatus.UNAUTHORIZED) return APP_ERROR_CODE.Unauthorized;
    if (status === HttpStatus.FORBIDDEN) return APP_ERROR_CODE.Forbidden;
    if (status === HttpStatus.CONFLICT) return APP_ERROR_CODE.Conflict;
    if (status === HttpStatus.BAD_REQUEST) return APP_ERROR_CODE.InvalidRequest;
    return APP_ERROR_CODE.InternalError;
  }
}
