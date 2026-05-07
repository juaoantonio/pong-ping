export const SYSTEM_ROLES = ["system_admin"] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];

export const TENANT_ROLES = ["owner", "admin", "member"] as const;
export type TenantRole = (typeof TENANT_ROLES)[number];
