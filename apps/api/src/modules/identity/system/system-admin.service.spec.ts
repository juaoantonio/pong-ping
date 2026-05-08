import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import type { FindOneOptions, FindOptionsWhere } from "typeorm";
import { describe, expect, it } from "vitest";
import type { ConfigSchema } from "../../../common/config/config.module";
import { IdentityUserEntity, TenantEntity, TenantMembershipEntity } from "../entities";
import { SystemAdminService } from "./system-admin.service";

describe("SystemAdminService", () => {
  it("creates tenant, pending user, and owner membership transactionally", async () => {
    const store = createStore();
    const service = createService(store);

    const tenant = await service.createTenant({
      name: "Acme",
      slug: "Acme",
      ownerEmail: "OWNER@example.test",
    });

    expect(tenant).toMatchObject({
      name: "Acme",
      slug: "acme",
      active: true,
      activeMembershipCount: 1,
      ownerAdminEmails: ["owner@example.test"],
    });
    expect(store.users.records[0]).toMatchObject({
      email: "owner@example.test",
      googleSubject: null,
    });
    expect(store.memberships.records[0]).toMatchObject({
      tenantId: tenant.id,
      userId: store.users.records[0].id,
      roles: ["owner"],
      active: true,
    });
  });

  it("rejects duplicate and reserved slugs", async () => {
    const store = createStore();
    const service = createService(store);
    await service.createTenant({
      name: "Acme",
      slug: "acme",
      ownerEmail: "owner@example.test",
    });

    await expect(
      service.createTenant({
        name: "Other",
        slug: "acme",
        ownerEmail: "owner2@example.test",
      }),
    ).rejects.toThrow(ConflictException);
    await expect(
      service.createTenant({
        name: "API",
        slug: "api",
        ownerEmail: "owner3@example.test",
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("rolls back tenant creation when membership creation fails", async () => {
    const store = createStore();
    const service = createService(store);
    store.memberships.failNextSave = true;

    await expect(
      service.createTenant({
        name: "Acme",
        slug: "acme",
        ownerEmail: "owner@example.test",
      }),
    ).rejects.toThrow("save failed");
    expect(store.tenants.records).toHaveLength(0);
    expect(store.users.records).toHaveLength(0);
    expect(store.memberships.records).toHaveLength(0);
  });

  it("lists and updates tenant lifecycle fields", async () => {
    const store = createStore();
    const service = createService(store);
    const created = await service.createTenant({
      name: "Acme",
      slug: "acme",
      ownerEmail: "owner@example.test",
      ownerRole: "admin",
    });

    await service.updateTenant(created.id, { name: "Acme Club", slug: "acme-club", active: false });
    const tenants = await service.listTenants();

    expect(tenants[0]).toMatchObject({
      id: created.id,
      name: "Acme Club",
      slug: "acme-club",
      active: false,
      ownerAdminEmails: ["owner@example.test"],
    });
  });

  it("creates, reactivates, updates, and deactivates memberships", async () => {
    const store = createStore();
    const service = createService(store);
    const tenant = await service.createTenant({
      name: "Acme",
      slug: "acme",
      ownerEmail: "owner@example.test",
    });

    const created = await service.upsertMembership(tenant.id, {
      email: "member@example.test",
      roles: ["member"],
    });
    expect(created).toMatchObject({ email: "member@example.test", roles: ["member"], active: true });

    await service.updateMembership(tenant.id, created.id, { roles: ["admin"] });
    expect(store.memberships.records.find((membership) => membership.id === created.id)?.roles).toEqual([
      "admin",
    ]);

    await service.deactivateMembership(tenant.id, created.id);
    expect(store.memberships.records.find((membership) => membership.id === created.id)?.active).toBe(false);

    const reactivated = await service.upsertMembership(tenant.id, {
      email: "member@example.test",
      roles: ["member"],
    });
    expect(reactivated).toMatchObject({ id: created.id, roles: ["member"], active: true });
  });

  it("prevents removing the last active owner or admin", async () => {
    const store = createStore();
    const service = createService(store);
    const tenant = await service.createTenant({
      name: "Acme",
      slug: "acme",
      ownerEmail: "owner@example.test",
    });
    const ownerMembership = store.memberships.records[0];

    await expect(
      service.updateMembership(tenant.id, ownerMembership.id, { roles: ["member"] }),
    ).rejects.toThrow(BadRequestException);
    await expect(service.deactivateMembership(tenant.id, ownerMembership.id)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("returns not found for missing tenants or memberships", async () => {
    const store = createStore();
    const service = createService(store);

    await expect(service.listMemberships("missing")).rejects.toThrow(NotFoundException);
    await expect(
      service.updateMembership("missing", "membership-1", { roles: ["admin"] }),
    ).rejects.toThrow(NotFoundException);
  });
});

function createService(store: ReturnType<typeof createStore>): SystemAdminService {
  return new SystemAdminService(
    {
      getOrThrow: (key: keyof ConfigSchema) => {
        if (key === "RESERVED_TENANT_SUBDOMAINS") return ["api", "www"];
        throw new Error(`Missing config key ${key}`);
      },
    } as never,
    store.dataSource as never,
    store.tenants as never,
    store.users as never,
    store.memberships as never,
  );
}

function createStore() {
  const users = new InMemoryRepository(IdentityUserEntity);
  const memberships = new InMemoryRepository(TenantMembershipEntity);
  const tenants = new InMemoryRepository(TenantEntity);

  users.afterRead = (user) => user;
  memberships.afterRead = (membership) => {
    membership.user = users.records.find((user) => user.id === membership.userId) as IdentityUserEntity;
    return membership;
  };
  tenants.afterRead = (tenant) => {
    tenant.memberships = memberships.records
      .filter((membership) => membership.tenantId === tenant.id)
      .map((membership) => memberships.afterRead({ ...membership } as TenantMembershipEntity));
    return tenant;
  };

  type TransactionCallback = (manager: { getRepository: (entity: Function) => unknown }) => unknown;
  const dataSource = {
    transaction: async (
      isolationOrCallback: "SERIALIZABLE" | TransactionCallback,
      maybeCallback?: TransactionCallback,
    ) => {
      const callback = typeof isolationOrCallback === "function" ? isolationOrCallback : maybeCallback;
      if (!callback) throw new Error("Missing transaction callback");
      const snapshot = {
        tenants: tenants.cloneRecords(),
        users: users.cloneRecords(),
        memberships: memberships.cloneRecords(),
      };

      try {
        return await callback({
          getRepository: (entity: Function) => {
            if (entity === TenantEntity) return tenants;
            if (entity === IdentityUserEntity) return users;
            if (entity === TenantMembershipEntity) return memberships;
            throw new Error("Unknown repository");
          },
        });
      } catch (error) {
        tenants.records = snapshot.tenants;
        users.records = snapshot.users;
        memberships.records = snapshot.memberships;
        throw error;
      }
    },
  };

  return { tenants, users, memberships, dataSource };
}

class InMemoryRepository<T extends { id: string; createdAt: Date; updatedAt: Date }> {
  records: T[] = [];
  failNextSave = false;
  afterRead: (entity: T) => T = (entity) => entity;
  private nextId = 1;

  constructor(private readonly entity: new () => T) {}

  create(input: Partial<T>): T {
    return Object.assign(new this.entity(), input);
  }

  async save(entity: T): Promise<T> {
    if (this.failNextSave) {
      this.failNextSave = false;
      throw new Error("save failed");
    }

    const now = new Date();
    if (!entity.id) {
      entity.id = `${this.entity.name}-${this.nextId++}`;
    }
    entity.createdAt ??= now;
    entity.updatedAt = now;

    const index = this.records.findIndex((record) => record.id === entity.id);
    if (index === -1) {
      this.records.push(entity);
    } else {
      this.records[index] = entity;
    }

    return this.afterRead(entity);
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    const where = options.where as FindOptionsWhere<T>;
    const record = this.records.find((candidate) => matches(candidate, where));
    return record ? this.afterRead({ ...record } as T) : null;
  }

  async find(options: { where?: FindOptionsWhere<T> } = {}): Promise<T[]> {
    return this.records
      .filter((candidate) => (options.where ? matches(candidate, options.where) : true))
      .map((record) => this.afterRead({ ...record } as T));
  }

  cloneRecords(): T[] {
    return this.records.map((record) => ({ ...record }) as T);
  }
}

function matches<T>(candidate: T, where: FindOptionsWhere<T>): boolean {
  return Object.entries(where).every(([key, expected]) => {
    const actual = candidate[key as keyof T];
    if (isNotOperator(expected)) {
      return actual !== expected._value;
    }
    return actual === expected;
  });
}

function isNotOperator(value: unknown): value is { _type: "not"; _value: unknown } {
  return Boolean(value && typeof value === "object" && (value as { _type?: string })._type === "not");
}
