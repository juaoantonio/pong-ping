import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseAuditEntity } from "../../../common/shared/entities/base-audit.entity";
import { IdentityUserEntity } from "./identity-user.entity";
import { TENANT_ROLES, type TenantRole } from "./identity-roles";
import { TenantEntity } from "./tenant.entity";

@Entity("identity_tenant_memberships")
@Index("ux_identity_tenant_memberships_tenant_user", ["tenantId", "userId"], { unique: true })
@Index("ix_identity_tenant_memberships_tenant", ["tenantId"])
@Index("ix_identity_tenant_memberships_user", ["userId"])
@Index("ix_identity_tenant_memberships_active", ["active"])
export class TenantMembershipEntity extends BaseAuditEntity {
  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ type: "enum", enum: [...TENANT_ROLES], array: true, default: [TENANT_ROLES[2]] })
  roles!: TenantRole[];

  @Column({ type: "boolean", default: true })
  active!: boolean;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.memberships, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant!: TenantEntity;

  @ManyToOne(() => IdentityUserEntity, (user) => user.memberships, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: IdentityUserEntity;
}
