import type {
  CreateSystemMembershipRequestContract,
  CreateSystemTenantRequestContract,
} from "@pong-ping/contracts";

export type TenantRole = CreateSystemMembershipRequestContract["roles"][number];
export type TenantOwnerRole = NonNullable<CreateSystemTenantRequestContract["ownerRole"]>;

export const tenantRoles: TenantRole[] = ["owner", "admin", "member"];
export const tenantOwnerRoles: TenantOwnerRole[] = ["owner", "admin"];

export function roleLabel(role: TenantRole) {
  if (role === "owner") return "Dono";
  if (role === "admin") return "Admin";
  return "Membro";
}
