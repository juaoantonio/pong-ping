export type Role = "superadmin" | "admin" | "user";

export const roles = ["superadmin", "admin", "user"] as const;

export const roleHierarchy: Record<Role, number> = {
  user: 1,
  admin: 2,
  superadmin: 3,
};

type UserLike = {
  role?: Role | null;
} | null | undefined;

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

export function hasRole(userRole: Role, requiredRole: Role) {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function isUser(user: UserLike) {
  return user?.role === "user";
}

export function isAdmin(user: UserLike) {
  return user?.role === "admin";
}

export function isSuperAdmin(user: UserLike) {
  return user?.role === "superadmin";
}

export function canAccessAdmin(userRole: Role) {
  return hasRole(userRole, "admin");
}

export function canManageUser(actorRole: Role, targetRole: Role) {
  if (actorRole === "superadmin") {
    return targetRole === "admin" || targetRole === "user";
  }

  if (actorRole === "admin") {
    return targetRole === "user";
  }

  return false;
}

export function canChangeRole(actorRole: Role) {
  return actorRole === "superadmin";
}

export function canDeleteUser(actorRole: Role, targetRole: Role) {
  return canManageUser(actorRole, targetRole);
}
