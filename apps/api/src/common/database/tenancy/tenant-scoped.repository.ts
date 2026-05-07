import { ForbiddenException } from "@nestjs/common";
import {
  type FindManyOptions,
  type FindOneOptions,
  type FindOptionsWhere,
  type ObjectLiteral,
  type QueryDeepPartialEntity,
  type Repository,
  type SelectQueryBuilder,
  type UpdateResult,
} from "typeorm";
import { type TenantContextProvider } from "./tenant-context.provider";

export type TenantScopedRecord = ObjectLiteral & {
  tenantId: string;
};

export class TenantScopedRepository<T extends TenantScopedRecord> {
  public constructor(
    private readonly repository: Repository<T>,
    private readonly tenantContext: TenantContextProvider,
  ) {}

  public async find(options: FindManyOptions<T> = {}): Promise<T[]> {
    const tenantId = this.currentTenantId();

    return this.repository.find({
      ...options,
      where: this.scopeWhere(options.where, tenantId),
    });
  }

  public async findOne(options: FindOneOptions<T>): Promise<T | null> {
    const tenantId = this.currentTenantId();

    return this.repository.findOne({
      ...options,
      where: this.scopeWhere(options.where, tenantId),
    });
  }

  public async findOneBy(where: FindOptionsWhere<T> | FindOptionsWhere<T>[]): Promise<T | null> {
    return this.repository.findOneBy(this.scopeWhere(where, this.currentTenantId()));
  }

  public create(entityLike: Partial<T>): T;
  public create(entityLike: Partial<T>[]): T[];
  public create(entityLike: Partial<T> | Partial<T>[]): T | T[] {
    const tenantId = this.currentTenantId();

    if (Array.isArray(entityLike)) {
      return this.repository.create(
        entityLike.map((entity) => this.withTenantForCreate(entity, tenantId)) as never,
      );
    }

    return this.repository.create(this.withTenantForCreate(entityLike, tenantId) as never);
  }

  public async save(entity: T): Promise<T>;
  public async save(entity: T[]): Promise<T[]>;
  public async save(entity: T | T[]): Promise<T | T[]> {
    const tenantId = this.currentTenantId();
    const entities = Array.isArray(entity) ? entity : [entity];

    for (const item of entities) {
      this.assertWritableTenant(item, tenantId);
    }

    return this.repository.save(entity as never);
  }

  public async update(
    criteria: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    partialEntity: QueryDeepPartialEntity<T>,
  ): Promise<UpdateResult> {
    const tenantId = this.currentTenantId();
    this.assertPartialTenant(partialEntity as Partial<T>, tenantId);

    return this.repository.update(this.scopeWhere(criteria, tenantId), partialEntity);
  }

  public createQueryBuilder(alias: string): SelectQueryBuilder<T> {
    const tenantId = this.currentTenantId();
    const queryBuilder = this.repository.createQueryBuilder(alias);

    return queryBuilder.andWhere(`${alias}.tenant_id = :tenantId`, { tenantId });
  }

  private currentTenantId(): string {
    return this.tenantContext.getTenantOrThrow().tenantId;
  }

  private scopeWhere(
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[] | undefined,
    tenantId: string,
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
    if (!where) {
      return { tenantId } as FindOptionsWhere<T>;
    }

    if (Array.isArray(where)) {
      return where.map((item) => this.scopeSingleWhere(item, tenantId));
    }

    return this.scopeSingleWhere(where, tenantId);
  }

  private scopeSingleWhere(where: FindOptionsWhere<T>, tenantId: string): FindOptionsWhere<T> {
    this.assertPartialTenant(where as Partial<T>, tenantId);

    return {
      ...where,
      tenantId,
    } as FindOptionsWhere<T>;
  }

  private withTenantForCreate(entityLike: Partial<T>, tenantId: string): Partial<T> {
    this.assertPartialTenant(entityLike, tenantId);

    return {
      ...entityLike,
      tenantId,
    };
  }

  private assertWritableTenant(entity: Partial<T>, tenantId: string): void {
    if (!entity.tenantId) {
      throw new ForbiddenException("Tenant-scoped writes require a tenant_id value.");
    }

    this.assertPartialTenant(entity, tenantId);
  }

  private assertPartialTenant(entity: Partial<T>, tenantId: string): void {
    if (entity.tenantId !== undefined && entity.tenantId !== tenantId) {
      throw new ForbiddenException("Tenant-scoped data cannot cross tenant boundaries.");
    }
  }
}
