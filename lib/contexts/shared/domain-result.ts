export type DomainError<TCode extends string = string> = {
  context: string;
  code: TCode;
  message?: string;
  cause?: unknown;
};

export type DomainResult<TValue, TError extends DomainError = DomainError> =
  | { ok: true; value: TValue }
  | { ok: false; error: TError };

export function ok<TValue>(value: TValue): DomainResult<TValue> {
  return { ok: true, value };
}

export function fail<TError extends DomainError>(
  error: TError,
): DomainResult<never, TError> {
  return { ok: false, error };
}
