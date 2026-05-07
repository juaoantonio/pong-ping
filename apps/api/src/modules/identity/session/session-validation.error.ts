export const SESSION_VALIDATION_FAILURE = {
  Missing: "missing",
  Unknown: "unknown",
  Expired: "expired",
  Revoked: "revoked",
  InactiveUser: "inactive_user",
  InactiveTenant: "inactive_tenant",
  InactiveMembership: "inactive_membership",
  TenantMismatch: "tenant_mismatch",
} as const;

export type SessionValidationFailure =
  (typeof SESSION_VALIDATION_FAILURE)[keyof typeof SESSION_VALIDATION_FAILURE];

export class SessionValidationError extends Error {
  public constructor(public readonly reason: SessionValidationFailure) {
    super(`Session validation failed: ${reason}`);
  }
}
