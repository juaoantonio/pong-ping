/**
 * @jest-environment node
 */

import { GET as getAccess } from "@/app/api/admin/access/route";
import { GET as getUsers } from "@/app/api/admin/users/route";
import { requireAdmin } from "@/app/api/admin/_shared";
import { prisma } from "@/lib/prisma";

jest.mock("@/app/api/admin/_shared", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    allowedEmail: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    authInvitation: {
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockedRequireAdmin = jest.mocked(requireAdmin);
const mockedPrisma = jest.mocked(prisma);

function actor(role: "admin" | "superadmin" = "admin") {
  return {
    id: "admin-id",
    role,
    email: "admin@example.com",
    name: "Admin",
    image: null,
    avatarUrl: null,
    createdAt: new Date("2026-04-30T12:00:00.000Z"),
  };
}

describe("admin GET pagination", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAdmin.mockResolvedValue({ actor: actor("superadmin") });
  });

  it("rejects invalid users pagination params", async () => {
    const response = await getUsers(
      new Request("http://test.local/api/admin/users?pageSize=20"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Parametro pageSize invalido.",
    });
    expect(mockedPrisma.user.findMany).not.toHaveBeenCalled();
  });

  it("paginates users with count, skip, take, and stable order", async () => {
    mockedPrisma.user.count.mockResolvedValue(80);
    mockedPrisma.user.findMany.mockResolvedValue([]);

    const response = await getUsers(
      new Request("http://test.local/api/admin/users?page=2&pageSize=50"),
    );

    expect(response.status).toBe(200);
    expect(mockedPrisma.user.count).toHaveBeenCalledWith({
      where: undefined,
    });
    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ role: "asc" }, { createdAt: "desc" }, { id: "desc" }],
        skip: 50,
        take: 50,
        where: undefined,
      }),
    );
    await expect(response.json()).resolves.toEqual({
      pageInfo: {
        page: 2,
        pageSize: 50,
        totalCount: 80,
        totalPages: 2,
        hasPreviousPage: true,
        hasNextPage: false,
      },
      users: [],
    });
  });

  it("rejects invalid access pagination params", async () => {
    const response = await getAccess(
      new Request("http://test.local/api/admin/access?page=-1"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Parametro page invalido.",
    });
    expect(mockedPrisma.allowedEmail.findMany).not.toHaveBeenCalled();
  });

  it("paginates allowed emails while keeping recent invitations capped", async () => {
    mockedPrisma.allowedEmail.count.mockResolvedValue(101);
    mockedPrisma.allowedEmail.findMany.mockResolvedValue([]);
    mockedPrisma.authInvitation.findMany.mockResolvedValue([]);

    const response = await getAccess(
      new Request("http://test.local/api/admin/access?page=3&pageSize=25"),
    );

    expect(response.status).toBe(200);
    expect(mockedPrisma.allowedEmail.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: 50,
        take: 25,
      }),
    );
    expect(mockedPrisma.authInvitation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    );
    await expect(response.json()).resolves.toEqual({
      allowedEmails: [],
      invitations: [],
      pageInfo: {
        page: 3,
        pageSize: 25,
        totalCount: 101,
        totalPages: 5,
        hasPreviousPage: true,
        hasNextPage: true,
      },
    });
  });
});
