import { ForbiddenException } from "@nestjs/common";
import {
  type EntitySubscriberInterface,
  type InsertEvent,
  type ObjectLiteral,
  type UpdateEvent,
} from "typeorm";
import { isTenantOwnedEntityTarget } from "../../shared/entities/tenant-owned-base.entity";
import { type TenantContextProvider } from "./tenant-context.provider";
import { type TenantScopedRecord } from "./tenant-scoped.repository";

export class TenantScopeWriteSubscriber implements EntitySubscriberInterface<TenantScopedRecord> {
  public constructor(private readonly tenantContext: TenantContextProvider) {}

  public beforeInsert(event: InsertEvent<TenantScopedRecord>): void {
    this.validateEventEntity(event.metadata.target, event.entity);
  }

  public beforeUpdate(event: UpdateEvent<TenantScopedRecord>): void {
    this.validateEventEntity(event.metadata.target, event.entity);
  }

  private validateEventEntity(target: unknown, entity: ObjectLiteral | undefined): void {
    if (!isTenantOwnedEntityTarget(target) || !entity) {
      return;
    }

    const tenantId = this.tenantContext.getTenantOrThrow().tenantId;
    const scopedEntity = entity as Partial<TenantScopedRecord>;

    if (!scopedEntity.tenantId) {
      throw new ForbiddenException("Tenant-scoped writes require a tenant_id value.");
    }

    if (scopedEntity.tenantId !== tenantId) {
      throw new ForbiddenException("Tenant-scoped data cannot cross tenant boundaries.");
    }
  }
}
