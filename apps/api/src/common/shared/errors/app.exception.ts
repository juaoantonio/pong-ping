import { HttpException, HttpStatus } from "@nestjs/common";
import type { AppErrorCode } from "./app-error-code.enum";

export class AppException extends HttpException {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details: unknown[] = [],
  ) {
    super({ code, message, details }, status);
  }
}
