/**
 * @jest-environment node
 */

import { POST as createAccess } from "@/app/api/admin/access/route";
import { POST as createTableInvite } from "@/app/api/admin/tables/[tableId]/invites/route";
import { POST as claimAccess } from "@/app/api/invitations/[token]/route";
import { POST as claimTableInvite } from "@/app/api/tables/join/[token]/route";
import { requireAdmin } from "@/app/api/admin/_shared";
import { getCurrentUser } from "@/lib/auth/session";
import {
  claimAccessInvitation,
  claimTableInvitation,
  createAccessInvitation,
  createTableInvitation,
} from "@/lib/contexts/invitations";

jest.mock("@/app/api/admin/_shared", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/lib/contexts/invitations", () => ({
  claimAccessInvitation: jest.fn(),
  claimTableInvitation: jest.fn(),
  createAccessInvitation: jest.fn(),
  createTableInvitation: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {},
}));

const mockedRequireAdmin = jest.mocked(requireAdmin);
const mockedGetCurrentUser = jest.mocked(getCurrentUser);
const mockedClaimAccessInvitation = jest.mocked(claimAccessInvitation);
const mockedClaimTableInvitation = jest.mocked(claimTableInvitation);
const mockedCreateAccessInvitation = jest.mocked(createAccessInvitation);
const mockedCreateTableInvitation = jest.mocked(createTableInvitation);

function actor() {
  return {
    id: "admin-1",
    tenantId: "tenant-1",
    role: "admin" as const,
    email: "admin@example.com",
    name: "Admin",
    avatarUrl: null,
    image: null,
    createdAt: new Date("2026-05-04T12:00:00.000Z"),
    tenant: { slug: "tenant-1", name: "Tenant 1" },
  };
}

describe("rotas de convite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAdmin.mockResolvedValue({ actor: actor() });
    mockedGetCurrentUser.mockResolvedValue(actor());
  });

  it("cria convites de acesso pelo contexto de convite", async () => {
    mockedCreateAccessInvitation.mockResolvedValue({
      ok: true,
      value: {
        id: "invite-1",
        token: "raw-token",
        expiresAt: new Date("2026-05-04T12:15:00.000Z"),
        oneTimeUse: true,
        createdAt: new Date("2026-05-04T12:00:00.000Z"),
      },
    });

    const response = await createAccess(
      new Request("http://test.local/api/admin/access", {
        method: "POST",
        body: JSON.stringify({
          type: "invite",
          expiresIn: "15m",
          oneTimeUse: true,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockedCreateAccessInvitation).toHaveBeenCalledWith(
      expect.anything(),
      {
        actorUserId: "admin-1",
        tenantId: "tenant-1",
        expiresIn: "15m",
        oneTimeUse: true,
      },
    );
    await expect(response.json()).resolves.toEqual({
      invitation: {
        id: "invite-1",
        expiresAt: "2026-05-04T12:15:00.000Z",
        oneTimeUse: true,
        createdAt: "2026-05-04T12:00:00.000Z",
        usedAt: null,
        usedByEmail: null,
      },
      inviteUrl: "http://test.local/invite/raw-token",
    });
  });

  it("reivindica convites de acesso pelo contexto de convite", async () => {
    mockedClaimAccessInvitation.mockResolvedValue({
      ok: true,
      value: {
        email: "person@example.com",
        invitationId: "invite-1",
        oneTimeUse: true,
      },
    });

    const response = await claimAccess(
      new Request("http://test.local/api/invitations/token", {
        method: "POST",
        body: JSON.stringify({ email: " Person@Example.COM " }),
      }),
      { params: Promise.resolve({ token: "raw-token" }) },
    );

    expect(response.status).toBe(200);
    expect(mockedClaimAccessInvitation).toHaveBeenCalledWith(
      expect.anything(),
      {
        email: "person@example.com",
        token: "raw-token",
      },
    );
    await expect(response.json()).resolves.toEqual({
      ok: true,
      email: "person@example.com",
    });
  });

  it("cria convites de mesa pelo contexto de convite", async () => {
    mockedCreateTableInvitation.mockResolvedValue({
      ok: true,
      value: {
        id: "table-invite-1",
        token: "table-token",
        expiresAt: new Date("2026-05-11T12:00:00.000Z"),
        oneTimeUse: false,
      },
    });

    const response = await createTableInvite(
      new Request("http://test.local", {
        method: "POST",
        body: JSON.stringify({ expiresIn: "7d", oneTimeUse: false }),
      }),
      { params: Promise.resolve({ tableId: "table-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockedCreateTableInvitation).toHaveBeenCalledWith(
      expect.anything(),
      {
        actorUserId: "admin-1",
        expiresIn: "7d",
        oneTimeUse: false,
        tableId: "table-1",
        tenantId: "tenant-1",
      },
    );
  });

  it("reivindica convites de mesa pelo contexto de convite", async () => {
    mockedClaimTableInvitation.mockResolvedValue({
      ok: true,
      value: {
        invitationId: "table-invite-1",
        tableId: "table-1",
        userId: "admin-1",
        oneTimeUse: false,
      },
    });

    const response = await claimTableInvite(
      new Request("http://test.local", { method: "POST" }),
      { params: Promise.resolve({ token: "table-token" }) },
    );

    expect(response.status).toBe(200);
    expect(mockedClaimTableInvitation).toHaveBeenCalledWith(expect.anything(), {
      token: "table-token",
      tenantId: "tenant-1",
      userId: "admin-1",
    });
    await expect(response.json()).resolves.toEqual({
      ok: true,
      tableId: "table-1",
    });
  });

  it("mantem mensagens de indisponibilidade especificas por contexto para reivindicacoes", async () => {
    mockedClaimAccessInvitation.mockResolvedValue({
      ok: false,
      error: { context: "invitations", code: "invitation_unavailable" },
    });

    const accessResponse = await claimAccess(
      new Request("http://test.local", {
        method: "POST",
        body: JSON.stringify({ email: "person@example.com" }),
      }),
      { params: Promise.resolve({ token: "spent" }) },
    );

    expect(accessResponse.status).toBe(400);
    await expect(accessResponse.json()).resolves.toEqual({
      error: "Convite invalido, expirado ou ja utilizado.",
    });

    mockedClaimTableInvitation.mockResolvedValue({
      ok: false,
      error: { context: "invitations", code: "invitation_not_found" },
    });

    const tableResponse = await claimTableInvite(
      new Request("http://test.local", { method: "POST" }),
      { params: Promise.resolve({ token: "spent" }) },
    );

    expect(tableResponse.status).toBe(404);
    await expect(tableResponse.json()).resolves.toEqual({
      error: "Convite de mesa invalido.",
    });
  });
});
