import { ForbiddenException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { type FindOptionsWhere, type Repository, type SelectQueryBuilder } from "typeorm";
import { TenantOwnedBaseEntity } from "../../shared/entities/tenant-owned-base.entity";
import { type TenantContextProvider } from "./tenant-context.provider";
import { assertTenantOwnedEntityTarget } from "./tenant-scoped-repository.provider";
import { TenantScopedRepository, type TenantScopedRecord } from "./tenant-scoped.repository";
import { TenantScopeWriteSubscriber } from "./tenant-scope-write.subscriber";

class TenantOwnedFixtureEntity extends TenantOwnedBaseEntity {
  name!: string;
}

class SystemFixtureEntity {
  id!: string;
}

type TenantFixture = TenantScopedRecord & {
  id: string;
  name: string;
};

describe("TenantScopedRepository", () => {
  it("applies the CLS tenant to reads", async () => {
    const { scopedRepository } = tenantRepository("tenant-a", [
      record("a-1", "tenant-a", "visible"),
      record("b-1", "tenant-b", "hidden"),
    ]);

    await expect(scopedRepository.find()).resolves.toEqual([record("a-1", "tenant-a", "visible")]);
    await expect(scopedRepository.findOneBy({ id: "b-1" })).resolves.toBeNull();
  });

  it("sets the CLS tenant on create and rejects mismatched create tenant_id", () => {
    const { scopedRepository } = tenantRepository("tenant-a", []);

    expect(scopedRepository.create({ id: "a-2", name: "created" })).toMatchObject({
      tenantId: "tenant-a",
    });
    expect(() => scopedRepository.create({ id: "b-2", name: "bad", tenantId: "tenant-b" })).toThrow(
      ForbiddenException,
    );
  });

  it("rejects missing or mismatched tenant_id on save", async () => {
    const { scopedRepository } = tenantRepository("tenant-a", []);

    await expect(scopedRepository.save(record("a-3", "tenant-a", "valid"))).resolves.toMatchObject({
      id: "a-3",
      tenantId: "tenant-a",
    });
    await expect(
      scopedRepository.save({ id: "missing", name: "bad" } as TenantFixture),
    ).rejects.toThrow(ForbiddenException);
    await expect(scopedRepository.save(record("b-3", "tenant-b", "bad"))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("scopes updates to the CLS tenant and rejects mismatched update tenant_id", async () => {
    const rows = [record("shared-id", "tenant-a", "a"), record("shared-id", "tenant-b", "b")];
    const { scopedRepository } = tenantRepository("tenant-a", rows);

    await expect(
      scopedRepository.update({ id: "shared-id" }, { name: "updated-a" }),
    ).resolves.toMatchObject({
      affected: 1,
    });
    expect(rows).toEqual([
      record("shared-id", "tenant-a", "updated-a"),
      record("shared-id", "tenant-b", "b"),
    ]);
    await expect(
      scopedRepository.update({ id: "shared-id" }, { tenantId: "tenant-b" }),
    ).rejects.toThrow(ForbiddenException);
  });

  it("adds the tenant predicate to query builders and rejects missing tenant context", async () => {
    const withTenant = tenantRepository("tenant-a", []);

    withTenant.scopedRepository.createQueryBuilder("item");

    expect(withTenant.queryBuilderWhere).toEqual({
      expression: "item.tenant_id = :tenantId",
      parameters: { tenantId: "tenant-a" },
    });

    const withoutTenant = tenantRepository(undefined, []);

    await expect(withoutTenant.scopedRepository.find()).rejects.toThrow(ForbiddenException);
  });
});

describe("tenant-owned entity convention", () => {
  it("marks business entities with tenant_id without forcing system entities into tenancy", () => {
    expect(TenantOwnedFixtureEntity.tenantOwned).toBe(true);
    expect(() => assertTenantOwnedEntityTarget(TenantOwnedFixtureEntity)).not.toThrow();
    expect(() => assertTenantOwnedEntityTarget(SystemFixtureEntity)).toThrow(
      "SystemFixtureEntity must extend TenantOwnedBaseEntity.",
    );
  });

  it("validates tenant-owned writes through the subscriber", () => {
    const subscriber = new TenantScopeWriteSubscriber(tenantProvider("tenant-a"));
    const event = {
      metadata: { target: TenantOwnedFixtureEntity },
      entity: record("b-4", "tenant-b", "bad"),
    };

    expect(() => subscriber.beforeInsert(event as never)).toThrow(ForbiddenException);
  });
});

function tenantRepository(tenantId: string | undefined, rows: TenantFixture[]) {
  let queryBuilderWhere:
    | {
        expression: string;
        parameters: Record<string, string>;
      }
    | undefined;

  const repository: Partial<Repository<TenantFixture>> = {
    find: async (options) => rows.filter((row) => matchesWhere(row, options?.where)),
    findOne: async (options) => rows.find((row) => matchesWhere(row, options?.where)) ?? null,
    findOneBy: async (where) => rows.find((row) => matchesWhere(row, where)) ?? null,
    create: (entityLike) => {
      if (Array.isArray(entityLike)) {
        return entityLike.map((entity) => ({ ...entity })) as TenantFixture[];
      }

      return { ...entityLike } as TenantFixture;
    },
    save: async (entity) => entity,
    update: async (criteria, partialEntity) => {
      const matchingRows = rows.filter((row) => matchesWhere(row, criteria));

      for (const row of matchingRows) {
        Object.assign(row, partialEntity);
      }

      return {
        affected: matchingRows.length,
        generatedMaps: [],
        raw: [],
      };
    },
    createQueryBuilder: (alias) =>
      ({
        andWhere: (expression: string, parameters: Record<string, string>) => {
          queryBuilderWhere = { expression, parameters };

          return {} as SelectQueryBuilder<TenantFixture>;
        },
      }) as SelectQueryBuilder<TenantFixture>,
  };

  return {
    get queryBuilderWhere() {
      return queryBuilderWhere;
    },
    scopedRepository: new TenantScopedRepository(
      repository as Repository<TenantFixture>,
      tenantProvider(tenantId),
    ),
  };
}

function tenantProvider(tenantId: string | undefined): TenantContextProvider {
  return {
    getTenantOrThrow: () => {
      if (!tenantId) {
        throw new ForbiddenException("Tenant context is required for tenant-scoped data access.");
      }

      return { tenantId };
    },
  };
}

function matchesWhere(
  row: TenantFixture,
  where: FindOptionsWhere<TenantFixture> | FindOptionsWhere<TenantFixture>[] | undefined,
): boolean {
  if (!where) {
    return true;
  }

  if (Array.isArray(where)) {
    return where.some((item) => matchesWhere(row, item));
  }

  return Object.entries(where).every(
    ([key, expected]) => row[key as keyof TenantFixture] === expected,
  );
}

function record(id: string, tenantId: string, name: string): TenantFixture {
  return { id, tenantId, name };
}
