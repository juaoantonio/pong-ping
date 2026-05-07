import { Column, Entity, Index, OneToMany } from "typeorm";
import { BaseAuditEntity } from "../../../common/shared/entities/base-audit.entity";
import { IdentitySessionEntity } from "./identity-session.entity";
import { SystemRoleAssignmentEntity } from "./system-role-assignment.entity";
import { TenantMembershipEntity } from "./tenant-membership.entity";

@Entity("identity_users")
@Index("ux_identity_users_google_subject", ["googleSubject"], { unique: true })
@Index("ux_identity_users_email", ["email"], { unique: true })
@Index("ix_identity_users_active", ["active"])
export class IdentityUserEntity extends BaseAuditEntity {
  @Column({ name: "google_subject", type: "varchar", length: 128 })
  googleSubject!: string;

  @Column({ type: "varchar", length: 320 })
  email!: string;

  @Column({ name: "display_name", type: "varchar", length: 160, nullable: true })
  displayName!: string | null;

  @Column({ name: "avatar_url", type: "varchar", length: 1024, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  @OneToMany(() => TenantMembershipEntity, (membership) => membership.user)
  memberships!: TenantMembershipEntity[];

  @OneToMany(() => SystemRoleAssignmentEntity, (assignment) => assignment.user)
  systemRoleAssignments!: SystemRoleAssignmentEntity[];

  @OneToMany(() => IdentitySessionEntity, (session) => session.user)
  sessions!: IdentitySessionEntity[];
}
