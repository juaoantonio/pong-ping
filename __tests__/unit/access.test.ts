import {
  allowEmail,
  hashInvitationToken,
  isEmailAllowed,
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth/access";
import {
  getInvitationExpiry,
  getInvitationExpiryLabel,
  isInvitationExpiryPreset,
} from "@/lib/invitations";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    allowedEmail: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

const mockedPrisma = jest.mocked(prisma);

describe("helpers de acesso por email e convite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("normaliza emails antes de consultar a allowlist", async () => {
    mockedPrisma.allowedEmail.findUnique.mockResolvedValue({ id: "allowed-email-id" } as never);

    await expect(isEmailAllowed(" User@Example.COM ")).resolves.toBe(true);

    expect(mockedPrisma.allowedEmail.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: { id: true },
    });
  });

  it("retorna falso quando nao ha email ou registro autorizado", async () => {
    mockedPrisma.allowedEmail.findUnique.mockResolvedValue(null);

    await expect(isEmailAllowed(null)).resolves.toBe(false);
    await expect(isEmailAllowed("blocked@example.com")).resolves.toBe(false);
  });

  it("cria ou reutiliza email autorizado normalizado com o id do admin", async () => {
    mockedPrisma.allowedEmail.upsert.mockResolvedValue({
      id: "allowed-email-id",
      email: "user@example.com",
      createdByUserId: "admin-id",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await allowEmail(" User@Example.COM ", "admin-id");

    expect(mockedPrisma.allowedEmail.upsert).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      create: {
        email: "user@example.com",
        createdByUserId: "admin-id",
      },
      update: {},
    });
  });

  it("valida email, gera hash deterministico e calcula expiracao curta", () => {
    jest.spyOn(Date, "now").mockReturnValue(new Date("2026-04-28T12:00:00.000Z").getTime());

    expect(normalizeEmail(" Invitee@Example.COM ")).toBe("invitee@example.com");
    expect(isValidEmail("invitee@example.com")).toBe(true);
    expect(isValidEmail("invalid-email")).toBe(false);
    expect(hashInvitationToken("token")).toBe(hashInvitationToken("token"));
    expect(getInvitationExpiry()).toEqual(new Date("2026-04-28T12:15:00.000Z"));
    expect(getInvitationExpiry("1h")).toEqual(new Date("2026-04-28T13:00:00.000Z"));
    expect(getInvitationExpiry("1d")).toEqual(new Date("2026-04-29T12:00:00.000Z"));
    expect(getInvitationExpiry("7d")).toEqual(new Date("2026-05-05T12:00:00.000Z"));
    expect(isInvitationExpiryPreset("15m")).toBe(true);
    expect(isInvitationExpiryPreset("bad")).toBe(false);
    expect(getInvitationExpiryLabel("7d")).toBe("7 dias");

    jest.restoreAllMocks();
  });
});
