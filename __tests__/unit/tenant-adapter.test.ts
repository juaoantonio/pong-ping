jest.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(() => ({})),
}));
jest.mock("@/lib/auth/access", () => ({
  normalizeEmail: (email: string) => email.trim().toLowerCase(),
}));
jest.mock("@/lib/auth/pending-tenant", () => ({
  getPendingTenantCookie: jest.fn(),
}));
jest.mock("@/lib/prisma", () => ({
  prisma: {},
}));

import { TenantAwarePrismaAdapter } from "@/lib/auth/tenant-adapter";

const tenantA = {
  tenantId: "tenant-a",
  tenantSlug: "alpha",
  tenantName: "Alpha",
  expiresAt: Date.now() + 60_000,
};

function createPrismaMock() {
  return {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    account: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };
}

describe("TenantAwarePrismaAdapter", () => {
  it("resolves the same email within the pending tenant only", async () => {
    const prisma = createPrismaMock();
    const tenantUsers = {
      "tenant-a": { id: "user-a", tenantId: "tenant-a", email: "same@example.com" },
      "tenant-b": { id: "user-b", tenantId: "tenant-b", email: "same@example.com" },
    };
    prisma.user.findUnique.mockImplementation(({ where }) => {
      const tenantId = where.tenantId_email.tenantId as keyof typeof tenantUsers;
      return Promise.resolve(tenantUsers[tenantId] ?? null);
    });

    const adapterA = TenantAwarePrismaAdapter(prisma as never, {
      getPendingTenant: async () => tenantA,
    });
    const adapterB = TenantAwarePrismaAdapter(prisma as never, {
      getPendingTenant: async () => ({
        ...tenantA,
        tenantId: "tenant-b",
        tenantSlug: "beta",
        tenantName: "Beta",
      }),
    });

    await expect(adapterA.getUserByEmail?.(" Same@Example.COM ")).resolves.toMatchObject({
      id: "user-a",
    });
    await expect(adapterB.getUserByEmail?.("same@example.com")).resolves.toMatchObject({
      id: "user-b",
    });

    expect(prisma.user.findUnique).toHaveBeenNthCalledWith(1, {
      where: {
        tenantId_email: {
          tenantId: "tenant-a",
          email: "same@example.com",
        },
      },
    });
    expect(prisma.user.findUnique).toHaveBeenNthCalledWith(2, {
      where: {
        tenantId_email: {
          tenantId: "tenant-b",
          email: "same@example.com",
        },
      },
    });
  });

  it("uses tenant-scoped provider account uniqueness", async () => {
    const prisma = createPrismaMock();
    prisma.account.findUnique.mockResolvedValue({
      id: "account-a",
      user: { id: "user-a", tenantId: "tenant-a", email: "same@example.com" },
    });
    const adapter = TenantAwarePrismaAdapter(prisma as never, {
      getPendingTenant: async () => tenantA,
    });

    await expect(
      adapter.getUserByAccount?.({
        provider: "google",
        providerAccountId: "google-sub",
      }),
    ).resolves.toMatchObject({ id: "user-a" });

    expect(prisma.account.findUnique).toHaveBeenCalledWith({
      where: {
        tenantId_provider_providerAccountId: {
          tenantId: "tenant-a",
          provider: "google",
          providerAccountId: "google-sub",
        },
      },
      include: {
        user: true,
      },
    });
  });

  it("writes tenantId when creating users and linking accounts", async () => {
    const prisma = createPrismaMock();
    prisma.user.create.mockResolvedValue({ id: "user-a" });
    prisma.account.create.mockResolvedValue({ id: "account-a" });
    const adapter = TenantAwarePrismaAdapter(prisma as never, {
      getPendingTenant: async () => tenantA,
    });

    await adapter.createUser?.({
      id: "provider-id",
      name: "User",
      email: " User@Example.COM ",
      emailVerified: null,
      image: null,
    });
    await adapter.linkAccount?.({
      userId: "user-a",
      type: "oauth",
      provider: "google",
      providerAccountId: "google-sub",
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: "User",
        email: "user@example.com",
        emailVerified: null,
        image: null,
        tenantId: "tenant-a",
      },
    });
    expect(prisma.account.create).toHaveBeenCalledWith({
      data: {
        userId: "user-a",
        type: "oauth",
        provider: "google",
        providerAccountId: "google-sub",
        tenantId: "tenant-a",
      },
    });
  });

  it("fails closed when OAuth adapter methods lack pending tenant context", async () => {
    const adapter = TenantAwarePrismaAdapter(createPrismaMock() as never, {
      getPendingTenant: async () => null,
    });

    await expect(adapter.getUserByEmail?.("user@example.com")).rejects.toThrow(
      "Missing pending tenant context",
    );
  });
});
