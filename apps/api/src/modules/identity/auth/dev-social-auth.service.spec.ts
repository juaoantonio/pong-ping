import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { ConfigSchema, SocialAuthDevUserConfig } from "../../../common/config/config.module";
import { DevSocialAuthService } from "./dev-social-auth.service";

describe("DevSocialAuthService", () => {
  it("resolve profile google por alias configurado", () => {
    const service = createService();

    expect(service.getGoogleProfile("member")).toEqual({
      googleSubject: "dev-google-member",
      email: "member@example.test",
      displayName: "Member Dev",
      avatarUrl: null,
    });
  });

  it("usa usuario default quando alias nao e informado", () => {
    const service = createService();

    expect(service.getGoogleProfile(undefined)).toMatchObject({
      googleSubject: "dev-google-admin",
      email: "admin@example.test",
    });
  });

  it("bloqueia bypass desligado ou fora de development", () => {
    expect(() => createService({ enabled: false }).getGoogleProfile("admin")).toThrow(
      ForbiddenException,
    );
    expect(() => createService({ nodeEnv: "test" }).getGoogleProfile("admin")).toThrow(
      ForbiddenException,
    );
  });

  it("rejeita alias desconhecido", () => {
    expect(() => createService().getGoogleProfile("missing")).toThrow(BadRequestException);
  });

  it("resolve tenant ativo para login dev", async () => {
    const service = createService();

    await expect(service.resolveTenant("teste")).resolves.toMatchObject({
      id: "tenant-1",
      slug: "teste",
      active: true,
    });
  });

  it("rejeita tenant ausente, reservado ou inativo", async () => {
    await expect(createService().resolveTenant(undefined)).rejects.toThrow(BadRequestException);
    await expect(createService().resolveTenant("api")).rejects.toThrow(BadRequestException);
    await expect(createService({ tenant: null }).resolveTenant("missing")).rejects.toThrow(
      BadRequestException,
    );
  });
});

function createService(
  options: {
    enabled?: boolean;
    nodeEnv?: string;
    users?: SocialAuthDevUserConfig[];
    tenant?: { id: string; slug: string; active: boolean } | null;
  } = {},
) {
  const users =
    options.users ??
    ([
      {
        alias: "admin",
        provider: "google",
        subject: "dev-google-admin",
        email: "admin@example.test",
        displayName: "Admin Dev",
        avatarUrl: null,
        default: true,
      },
      {
        alias: "member",
        provider: "google",
        subject: "dev-google-member",
        email: "member@example.test",
        displayName: "Member Dev",
        avatarUrl: null,
      },
    ] satisfies SocialAuthDevUserConfig[]);

  return new DevSocialAuthService(
    {
      getOrThrow: (key: keyof ConfigSchema) => {
        if (key === "NODE_ENV") return options.nodeEnv ?? "development";
        if (key === "SOCIAL_AUTH_DEV_BYPASS_ENABLED") return options.enabled ?? true;
        if (key === "SOCIAL_AUTH_DEV_USERS") return users;
        if (key === "RESERVED_TENANT_SUBDOMAINS") return ["auth", "api", "www"];
        throw new Error(`Missing config key ${key}`);
      },
    } as never,
    {
      findOne: vi.fn(async () =>
        options.tenant === undefined
          ? { id: "tenant-1", slug: "teste", active: true }
          : options.tenant,
      ),
    } as never,
  );
}
