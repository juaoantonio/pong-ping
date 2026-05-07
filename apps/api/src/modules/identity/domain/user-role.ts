import { DomainRuleViolation } from "../../core/shared/domain";

export const USER_ROLES = ["user", "admin", "superadmin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function ensureUserRole(value: string): UserRole {
  if (isUserRole(value)) {
    return value;
  }

  throw new DomainRuleViolation(
    "invalid_user_role",
    "User role must be user, admin, or superadmin.",
  );
}

function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}
