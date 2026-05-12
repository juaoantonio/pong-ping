import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { ConfigSchema } from "../../../common/config/config.module";
import { TenantEntity } from "../entities";
import { OAuthStateService, validateInternalReturnTo } from "./oauth-state.service";

describe("OAuthStateService", () => {
  it("gera e valida state assinado para tenant ativo", async () => {
    const service = createService();

    const rawState = service.createTenantState({
      tenantId: "tenant-1",
      tenantSlug: "acme",
      returnTo: "/club/settings",
    });

    await expect(service.validateTenantState(rawState)).resolves.toMatchObject({
      payload: {
        tenantId: "tenant-1",
        tenantSlug: "acme",
        returnTo: "/club/settings",
        nonce: expect.any(String),
        iat: expect.any(Number),
        exp: expect.any(Number),
      },
      tenant: expect.objectContaining({ id: "tenant-1", slug: "acme" }),
    });
  });

  it("rejeita state ausente, malformado e adulterado", async () => {
    const service = createService();
    const rawState = service.createTenantState({
      tenantId: "tenant-1",
      tenantSlug: "acme",
      returnTo: "/club",
    });
    const [payload, signature] = rawState.split(".");

    await expect(service.validateTenantState(undefined)).rejects.toThrow(BadRequestException);
    await expect(service.validateTenantState("invalid")).rejects.toThrow(BadRequestException);
    await expect(service.validateTenantState(`${payload}x.${signature}`)).rejects.toThrow(
      BadRequestException,
    );
    await expect(createService({}, "b".repeat(32)).validateTenantState(rawState)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("rejeita state expirado e tenant inativo", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-12T12:00:00.000Z"));
    const service = createService();
    const rawState = service.createTenantState({
      tenantId: "tenant-1",
      tenantSlug: "acme",
      returnTo: "/club",
    });

    vi.setSystemTime(new Date("2026-05-12T12:11:00.000Z"));
    await expect(service.validateTenantState(rawState)).rejects.toThrow(BadRequestException);
    vi.useRealTimers();

    await expect(
      createService({ active: false }).validateTenantState(
        createService().createTenantState({
          tenantId: "tenant-1",
          tenantSlug: "acme",
          returnTo: "/club",
        }),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejeita returnTo externo", () => {
    expect(() => validateInternalReturnTo("https://example.test/club")).toThrow(
      BadRequestException,
    );
    expect(() => validateInternalReturnTo("//example.test/club")).toThrow(BadRequestException);
    expect(validateInternalReturnTo(undefined)).toBe("/club");
  });
});

function createService(tenantOverrides: Partial<TenantEntity> = {}, secret = "a".repeat(32)) {
  const tenant = Object.assign(new TenantEntity(), {
    id: "tenant-1",
    slug: "acme",
    active: true,
    ...tenantOverrides,
  });

  return new OAuthStateService(
    {
      getOrThrow: (key: keyof ConfigSchema) => {
        if (key === "SESSION_SECRET") return secret;
        throw new Error(`Missing config key ${key}`);
      },
    } as never,
    {
      findOne: vi.fn(async () => tenant),
    } as never,
  );
}
