import { type Provider } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { type EntityClassOrSchema } from "@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type";
import { type EntityTarget, type Repository } from "typeorm";
import {
  isTenantOwnedEntityTarget,
  type TenantOwnedBaseEntity,
} from "../../shared/entities/tenant-owned-base.entity";
import { ClsTenantContextProvider } from "./tenant-context.provider";
import { TenantScopedRepository, type TenantScopedRecord } from "./tenant-scoped.repository";

export function getTenantScopedRepositoryToken(entity: EntityTarget<unknown>): string {
  return `${getEntityName(entity)}TenantScopedRepository`;
}

export function createTenantScopedRepositoryProvider<T extends TenantScopedRecord>(
  entity: EntityTarget<T>,
): Provider<TenantScopedRepository<T>> {
  assertTenantOwnedEntityTarget(entity);

  return {
    provide: getTenantScopedRepositoryToken(entity),
    inject: [getRepositoryToken(entity as EntityClassOrSchema), ClsTenantContextProvider],
    useFactory: (repository: Repository<T>, tenantContext: ClsTenantContextProvider) =>
      new TenantScopedRepository(repository, tenantContext),
  };
}

export function assertTenantOwnedEntityTarget(entity: EntityTarget<unknown>): void {
  if (!isTenantOwnedEntityTarget(entity)) {
    throw new Error(`${getEntityName(entity)} must extend TenantOwnedBaseEntity.`);
  }
}

function getEntityName(entity: EntityTarget<unknown>): string {
  if (typeof entity === "function") {
    return entity.name;
  }

  if (
    typeof entity === "object" &&
    "options" in entity &&
    typeof entity.options.name === "string"
  ) {
    return entity.options.name;
  }

  return String(entity);
}

export type TenantOwnedEntityClass<T extends TenantOwnedBaseEntity> = new (...args: never[]) => T;
