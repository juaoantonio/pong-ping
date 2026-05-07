export const APP_ERROR_CODE = {
  ValidationFailed: "VALIDATION_FAILED",
  InvalidRequest: "INVALID_REQUEST",
  NotFound: "NOT_FOUND",
  Unauthorized: "UNAUTHORIZED",
  Forbidden: "FORBIDDEN",
  Conflict: "CONFLICT",
  InternalError: "INTERNAL_ERROR",
} as const;

export type AppErrorCode = (typeof APP_ERROR_CODE)[keyof typeof APP_ERROR_CODE];
