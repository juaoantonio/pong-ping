import { describe, expect, it, vi } from "vitest";
import { SystemAdminController } from "./system-admin.controller";

describe("SystemAdminController", () => {
  it("delegates tenant endpoints to the system admin service", async () => {
    const service = {
      listTenants: vi.fn(async () => [{ id: "tenant-1" }]),
      createTenant: vi.fn(async () => ({ id: "tenant-2" })),
      updateTenant: vi.fn(async () => ({ id: "tenant-1", active: false })),
    };
    const controller = new SystemAdminController(service as never);

    await expect(controller.listTenants()).resolves.toEqual([{ id: "tenant-1" }]);
    await expect(
      controller.createTenant({
        name: "Acme",
        slug: "acme",
        ownerEmail: "owner@example.test",
      }),
    ).resolves.toEqual({ id: "tenant-2" });
    await expect(controller.updateTenant("tenant-1", { active: false })).resolves.toEqual({
      id: "tenant-1",
      active: false,
    });
    expect(service.createTenant).toHaveBeenCalledWith({
      name: "Acme",
      slug: "acme",
      ownerEmail: "owner@example.test",
    });
    expect(service.updateTenant).toHaveBeenCalledWith("tenant-1", { active: false });
  });

  it("delegates membership endpoints and returns delete response", async () => {
    const service = {
      listMemberships: vi.fn(async () => [{ id: "membership-1" }]),
      upsertMembership: vi.fn(async () => ({ id: "membership-2" })),
      updateMembership: vi.fn(async () => ({ id: "membership-1", roles: ["admin"] })),
      deactivateMembership: vi.fn(async () => undefined),
    };
    const controller = new SystemAdminController(service as never);

    await expect(controller.listMemberships("tenant-1")).resolves.toEqual([{ id: "membership-1" }]);
    await expect(
      controller.createMembership("tenant-1", {
        email: "member@example.test",
        roles: ["member"],
      }),
    ).resolves.toEqual({ id: "membership-2" });
    await expect(
      controller.updateMembership("tenant-1", "membership-1", { roles: ["admin"] }),
    ).resolves.toEqual({ id: "membership-1", roles: ["admin"] });
    await expect(controller.deactivateMembership("tenant-1", "membership-1")).resolves.toEqual({
      deactivated: true,
    });

    expect(service.upsertMembership).toHaveBeenCalledWith("tenant-1", {
      email: "member@example.test",
      roles: ["member"],
    });
    expect(service.deactivateMembership).toHaveBeenCalledWith("tenant-1", "membership-1");
  });
});
