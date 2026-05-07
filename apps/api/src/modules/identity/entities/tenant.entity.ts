import { Column, Entity, Index, OneToMany } from "typeorm";
import { BaseAuditEntity } from "../../../common/shared/entities/base-audit.entity";
import { IdentitySessionEntity } from "./identity-session.entity";
import { TenantMembershipEntity } from "./tenant-membership.entity";

@Entity("identity_tenants")
@Index("ux_identity_tenants_slug", ["slug"], { unique: true })
@Index("ix_identity_tenants_active", ["active"])
export class TenantEntity extends BaseAuditEntity {
  @Column({ type: "varchar", length: 63 })
  slug!: string;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ name: "active", type: "boolean", default: true })
  active!: boolean;

  @OneToMany(() => TenantMembershipEntity, (membership) => membership.tenant)
  memberships!: TenantMembershipEntity[];

  @OneToMany(() => IdentitySessionEntity, (session) => session.tenant)
  sessions!: IdentitySessionEntity[];
}
