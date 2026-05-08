/**
 * @jest-environment node
 */

import {
  GET as getTenants,
  POST as postTenants,
} from "@/app/api/admin/tenants/route";
import { requireAdmin } from "@/app/api/admin/_shared";
import { prisma } from "@/lib/prisma";

jest.mock("@/app/api/admin/_shared", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    tenant: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockedRequireAdmin = jest.mocked(requireAdmin);
const mockedPrisma = jest.mocked(prisma);

function actor(role: "admin" | "superadmin" = "superadmin") {
  return {
    id: "admin-id",
    role,
    email: "admin@example.com",
    name: "Admin",
    image: null,
    avatarUrl: null,
    createdAt: new Date("2026-04-30T12:00:00.000Z"),
    tenantId: "tenant-1",
    tenant: { slug: "tenant-1", name: "Tenant 1" },
  };
}

describe("rota admin de tenants", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAdmin.mockResolvedValue({ actor: actor("superadmin") });
  });

  it("nega gerenciamento de tenant para admins de tenant", async () => {
    mockedRequireAdmin.mockResolvedValue({ actor: actor("admin") });

    const response = await getTenants();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Sem permissao.",
    });
    expect(mockedPrisma.tenant.findMany).not.toHaveBeenCalled();
  });

  it("lista tenants para superadmins", async () => {
    const createdAt = new Date("2026-05-05T12:00:00.000Z");
    mockedPrisma.tenant.findMany.mockResolvedValue([
      {
        id: "tenant-a",
        name: "Tenant A",
        slug: "tenant-a",
        createdAt,
        _count: { users: 3 },
      },
    ] as never);

    const response = await getTenants();

    expect(response.status).toBe(200);
    expect(mockedPrisma.tenant.findMany).toHaveBeenCalledWith({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
    await expect(response.json()).resolves.toEqual({
      tenants: [
        {
          id: "tenant-a",
          name: "Tenant A",
          slug: "tenant-a",
          createdAt: createdAt.toISOString(),
          userCount: 3,
        },
      ],
    });
  });

  it("cria tenant com slug gerado", async () => {
    const createdAt = new Date("2026-05-05T12:00:00.000Z");
    mockedPrisma.tenant.create.mockResolvedValue({
      id: "tenant-id",
      name: "Clube Sao Paulo",
      slug: "clube-sao-paulo",
      createdAt,
    } as never);

    const response = await postTenants(
      new Request("http://test.local/api/admin/tenants", {
        method: "POST",
        body: JSON.stringify({ name: "Clube Sao Paulo" }),
      }),
    );

    expect(response.status).toBe(201);
    expect(mockedPrisma.tenant.create).toHaveBeenCalledWith({
      data: {
        name: "Clube Sao Paulo",
        slug: "clube-sao-paulo",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });
    await expect(response.json()).resolves.toEqual({
      tenant: {
        id: "tenant-id",
        name: "Clube Sao Paulo",
        slug: "clube-sao-paulo",
        createdAt: createdAt.toISOString(),
        userCount: 0,
      },
    });
  });
});
