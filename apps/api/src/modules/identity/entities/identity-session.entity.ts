import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseAuditEntity } from "../../../common/shared/entities/base-audit.entity";
import { IdentityUserEntity } from "./identity-user.entity";
import { TenantEntity } from "./tenant.entity";

@Entity("identity_sessions")
@Index("ux_identity_sessions_token_hash", ["tokenHash"], { unique: true })
@Index("ix_identity_sessions_user_tenant", ["userId", "tenantId"])
@Index("ix_identity_sessions_expires_at", ["expiresAt"])
@Index("ix_identity_sessions_revoked_at", ["revokedAt"])
export class IdentitySessionEntity extends BaseAuditEntity {
  @Column({ name: "token_hash", type: "varchar", length: 128 })
  tokenHash!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "tenant_id", type: "uuid", nullable: true })
  tenantId!: string | null;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
  revokedAt!: Date | null;

  @Column({ name: "last_used_at", type: "timestamptz" })
  lastUsedAt!: Date;

  @Column({ name: "user_agent", type: "varchar", length: 512, nullable: true })
  userAgent!: string | null;

  @Column({ name: "ip_address", type: "varchar", length: 64, nullable: true })
  ipAddress!: string | null;

  @ManyToOne(() => IdentityUserEntity, (user) => user.sessions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: IdentityUserEntity;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.sessions, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "tenant_id" })
  tenant!: TenantEntity | null;
}
