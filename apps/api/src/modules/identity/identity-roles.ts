export const IDENTITY_USER_ROLE = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "superadmin",
} as const;

export type IdentityUserRole = (typeof IDENTITY_USER_ROLE)[keyof typeof IDENTITY_USER_ROLE];

export const IDENTITY_SYSTEM_ROLE = {
  SYSTEM_ADMIN: "system_admin",
} as const;

export type IdentitySystemRole = (typeof IDENTITY_SYSTEM_ROLE)[keyof typeof IDENTITY_SYSTEM_ROLE];

export const IDENTITY_TENANT_ROLE = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export type IdentityTenantRole = (typeof IDENTITY_TENANT_ROLE)[keyof typeof IDENTITY_TENANT_ROLE];

export const USER_ROLES = [
  IDENTITY_USER_ROLE.USER,
  IDENTITY_USER_ROLE.ADMIN,
  IDENTITY_USER_ROLE.SUPER_ADMIN,
] as const;

export type IdentityUserRoles = typeof USER_ROLES;

export const SYSTEM_ROLES = [IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN] as const;

export type IdentitySystemRoles = typeof SYSTEM_ROLES;

export const TENANT_ROLES = [
  IDENTITY_TENANT_ROLE.OWNER,
  IDENTITY_TENANT_ROLE.ADMIN,
  IDENTITY_TENANT_ROLE.MEMBER,
] as const;

export type IdentityTenantRoles = typeof TENANT_ROLES;

export const TENANT_ADMIN_ROLES = [IDENTITY_TENANT_ROLE.OWNER, IDENTITY_TENANT_ROLE.ADMIN] as const;

export type IdentityTenantAdminRoles = typeof TENANT_ADMIN_ROLES;
