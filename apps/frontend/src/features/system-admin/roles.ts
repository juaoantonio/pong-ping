import type {
  CreateSystemMembershipRequestContract,
} from "@pong-ping/contracts";

export type TenantRole = CreateSystemMembershipRequestContract["roles"][number];

export const tenantRoles: TenantRole[] = ["admin", "member"];

export function roleLabel(role: TenantRole) {
  if (role === "admin") return "Admin";
  return "Membro";
}
