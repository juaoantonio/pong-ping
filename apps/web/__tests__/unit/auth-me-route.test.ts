/**
 * @jest-environment node
 */

import { PATCH } from "@/app/api/auth/me/route";
import { requireAuth, toClientAuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: jest.fn(),
  requireAuth: jest.fn(),
  toClientAuthenticatedUser: jest.fn((user) => ({
    id: user.id,
    tenantName: null,
    tenantSlug: null,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? user.image,
    role: user.role,
  })),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
    user: {
      update: jest.fn(),
    },
    athleteProfile: {
      upsert: jest.fn(),
    },
  },
}));

const mockedRequireAuth = jest.mocked(requireAuth);
const mockedToClientAuthenticatedUser = jest.mocked(toClientAuthenticatedUser);
const mockedPrisma = jest.mocked(prisma);

function request(body: Record<string, unknown>) {
  return new Request("http://test.local/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

function authUser(tenantId: string | null = "tenant-1") {
  return {
    id: "user-1",
    tenantId,
    tenant: tenantId ? { slug: "acme", name: "Acme" } : null,
    name: "Ana",
    email: "ana@example.com",
    image: null,
    avatarUrl: null,
    role: "user" as const,
    createdAt: new Date("2026-05-01T12:00:00.000Z"),
  };
}

describe("rota PATCH /api/auth/me", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrisma.$transaction.mockImplementation((operations) =>
      Promise.all(operations),
    );
    mockedRequireAuth.mockResolvedValue(authUser());
    mockedPrisma.user.update.mockResolvedValue({
      id: "user-1",
      name: "Ana Silva",
      email: "ana@example.com",
      image: null,
      avatarUrl: null,
      role: "user",
    });
    mockedPrisma.athleteProfile.upsert.mockResolvedValue({ id: "profile-1" });
  });

  it("atualiza nome e faz upsert de valores aparados do perfil de atleta", async () => {
    const response = await PATCH(
      request({
        name: " Ana Silva ",
        technicalLevel: "intermediate",
        gripStyle: "classic",
        playingStyle: "offensive",
        bladeName: "  Viscaria  ",
        forehandRubberName: " Tenergy 05 ",
        backhandRubberName: "  ",
        equipmentNotes: "  Leve  ",
        elo: 9999,
      }),
    );

    expect(response.status).toBe(200);
    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: { name: "Ana Silva" },
      }),
    );
    expect(mockedPrisma.athleteProfile.upsert).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
      },
      create: {
        tenantId: "tenant-1",
        userId: "user-1",
        technicalLevel: "intermediate",
        gripStyle: "classic",
        playingStyle: "offensive",
        bladeName: "Viscaria",
        forehandRubberName: "Tenergy 05",
        backhandRubberName: null,
        equipmentNotes: "Leve",
      },
      update: {
        technicalLevel: "intermediate",
        gripStyle: "classic",
        playingStyle: "offensive",
        bladeName: "Viscaria",
        forehandRubberName: "Tenergy 05",
        backhandRubberName: null,
        equipmentNotes: "Leve",
      },
    });
    expect(mockedToClientAuthenticatedUser).toHaveBeenCalled();
  });

  it("mantem comportamento existente de validacao de nome", async () => {
    const response = await PATCH(request({ name: "A" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "O nome deve ter entre 2 e 80 caracteres.",
    });
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
    expect(mockedPrisma.athleteProfile.upsert).not.toHaveBeenCalled();
  });

  it("rejeita valores invalidos do perfil de atleta antes da persistencia", async () => {
    const response = await PATCH(
      request({
        name: "Ana Silva",
        gripStyle: "shakehand",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Empunhadura invalida.",
    });
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
    expect(mockedPrisma.athleteProfile.upsert).not.toHaveBeenCalled();
  });

  it("rejeita campos de equipamento grandes demais", async () => {
    const response = await PATCH(
      request({
        name: "Ana Silva",
        bladeName: "x".repeat(121),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Madeira deve ter no maximo 120 caracteres.",
    });
    expect(mockedPrisma.athleteProfile.upsert).not.toHaveBeenCalled();
  });

  it("exige contexto de tenant para escritas no perfil de atleta", async () => {
    mockedRequireAuth.mockResolvedValue(authUser(null));

    const response = await PATCH(request({ name: "Ana Silva" }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Contexto do tenant obrigatorio.",
    });
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
    expect(mockedPrisma.athleteProfile.upsert).not.toHaveBeenCalled();
  });
});
