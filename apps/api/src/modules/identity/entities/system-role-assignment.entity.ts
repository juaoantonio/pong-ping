import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseAuditEntity } from "../../../common/shared/entities/base-audit.entity";
import { SYSTEM_ROLES, type IdentitySystemRole } from "../identity-roles";
import { IdentityUserEntity } from "./identity-user.entity";

@Entity("identity_system_role_assignments")
@Index("ux_identity_system_role_assignments_user_role", ["userId", "role"], { unique: true })
@Index("ix_identity_system_role_assignments_user", ["userId"])
@Index("ix_identity_system_role_assignments_role", ["role"])
export class SystemRoleAssignmentEntity extends BaseAuditEntity {
  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ type: "enum", enum: [...SYSTEM_ROLES] })
  role!: IdentitySystemRole;

  @ManyToOne(() => IdentityUserEntity, (user) => user.systemRoleAssignments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user!: IdentityUserEntity;
}
