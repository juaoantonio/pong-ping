import { HttpException, HttpStatus } from "@nestjs/common";

export class ApiHttpException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus,
    public readonly details?: unknown,
  ) {
    super({ code, message, details }, status);
  }
}

export function badRequest(message: string, code = "bad_request") {
  return new ApiHttpException(code, message, HttpStatus.BAD_REQUEST);
}

export function unauthorized(message = "Nao autenticado.") {
  return new ApiHttpException("unauthorized", message, HttpStatus.UNAUTHORIZED);
}

export function forbidden(message = "Sem permissao.") {
  return new ApiHttpException("forbidden", message, HttpStatus.FORBIDDEN);
}

export function notFound(message: string, code = "not_found") {
  return new ApiHttpException(code, message, HttpStatus.NOT_FOUND);
}

export function conflict(message: string, code = "conflict") {
  return new ApiHttpException(code, message, HttpStatus.CONFLICT);
}
