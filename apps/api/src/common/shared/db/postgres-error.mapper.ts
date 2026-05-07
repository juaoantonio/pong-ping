import { HttpStatus } from "@nestjs/common";
import { AppException } from "../errors/app.exception";
import { APP_ERROR_CODE } from "../errors/app-error-code.enum";

type PostgresError = {
  code?: string;
  detail?: string;
};

export function mapPostgresError(error: unknown): AppException | undefined {
  const pgError = error as PostgresError;

  if (pgError.code === "23505") {
    return new AppException(
      APP_ERROR_CODE.Conflict,
      "A record with the same unique value already exists.",
      HttpStatus.CONFLICT,
      pgError.detail ? [pgError.detail] : [],
    );
  }

  if (pgError.code === "23503") {
    return new AppException(
      APP_ERROR_CODE.InvalidRequest,
      "The request references a related record that does not exist.",
      HttpStatus.BAD_REQUEST,
      pgError.detail ? [pgError.detail] : [],
    );
  }

  return undefined;
}
