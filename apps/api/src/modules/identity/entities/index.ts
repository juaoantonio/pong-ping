import { IdentitySessionEntity } from "./identity-session.entity";
import { IdentityUserEntity } from "./identity-user.entity";
import { SystemRoleAssignmentEntity } from "./system-role-assignment.entity";
import { TenantMembershipEntity } from "./tenant-membership.entity";
import { TenantEntity } from "./tenant.entity";

export { IdentitySessionEntity } from "./identity-session.entity";
export { IdentityUserEntity } from "./identity-user.entity";
export { SYSTEM_ROLES, TENANT_ROLES, type SystemRole, type TenantRole } from "./identity-roles";
export { SystemRoleAssignmentEntity } from "./system-role-assignment.entity";
export { TenantMembershipEntity } from "./tenant-membership.entity";
export { TenantEntity } from "./tenant.entity";

export const IDENTITY_ENTITIES = [
  TenantEntity,
  IdentityUserEntity,
  TenantMembershipEntity,
  SystemRoleAssignmentEntity,
  IdentitySessionEntity,
];

export const identityEntities = IDENTITY_ENTITIES;
