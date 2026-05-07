import { Column, Index } from "typeorm";
import { BaseAuditEntity } from "./base-audit.entity";

export abstract class TenantOwnedBaseEntity extends BaseAuditEntity {
  public static readonly tenantOwned = true;

  @Index()
  @Column({ name: "tenant_id", type: "uuid" })
  tenantId!: string;
}

export function isTenantOwnedEntityTarget(target: unknown): boolean {
  if (typeof target !== "function") {
    return false;
  }

  return (
    target === TenantOwnedBaseEntity ||
    TenantOwnedBaseEntity.prototype.isPrototypeOf(target.prototype)
  );
}
