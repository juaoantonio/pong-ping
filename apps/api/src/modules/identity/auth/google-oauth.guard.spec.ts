import type { ExecutionContext } from "@nestjs/common";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { ConfigSchema } from "../../../common/config/config.module";
import { GoogleOAuthGuard } from "./google-oauth.guard";

describe("GoogleOAuthGuard", () => {
  it("usa callback central e state assinado para inicio de OAuth tenant", async () => {
    const guard = createGuard();
    const context = executionContext({
      path: "/v1/auth/google",
      headers: { host: "api.localhost.me:3001" },
      query: { tenant: "teste", returnTo: "/club" },
    });

    await guard.prepareTenantOAuthStart(requestFromContext(context));

    expect(guard.getAuthenticateOptions(context)).toMatchObject({
      callbackURL: "http://api.localhost.me:3001/v1/auth/google/callback",
      state: "signed-state",
    });
  });

  it("rejeita inicio em host diferente do auth central", async () => {
    const guard = createGuard();

    await expect(
      guard.prepareTenantOAuthStart(
        requestFromContext(
          executionContext({
            path: "/v1/auth/google",
            headers: { host: "teste.localhost.me:3001" },
            query: { tenant: "teste" },
          }),
        ),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it("rejeita tenant ausente, reservado ou inativo", async () => {
    await expect(
      createGuard().prepareTenantOAuthStart(
        requestFromContext(
          executionContext({
            path: "/v1/auth/google",
            headers: { host: "api.localhost.me:3001" },
            query: {},
          }),
        ),
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      createGuard().prepareTenantOAuthStart(
        requestFromContext(
          executionContext({
            path: "/v1/auth/google",
            headers: { host: "api.localhost.me:3001" },
            query: { tenant: "auth" },
          }),
        ),
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      createGuard({ tenant: null }).prepareTenantOAuthStart(
        requestFromContext(
          executionContext({
            path: "/v1/auth/google",
            headers: { host: "api.localhost.me:3001" },
            query: { tenant: "missing" },
          }),
        ),
      ),
    ).rejects.toThrow(BadRequestException);
  });
});

function createGuard(
  options: { tenant?: { id: string; slug: string; active: boolean } | null } = {},
) {
  return new GoogleOAuthGuard(
    fakeConfig(),
    {
      validateInternalReturnTo: vi.fn((returnTo?: string) => returnTo ?? "/club"),
      createTenantState: vi.fn(() => "signed-state"),
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

function executionContext(request: {
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

function requestFromContext(context: ExecutionContext) {
  return context.switchToHttp().getRequest() as never;
}

function fakeConfig() {
  return {
    getOrThrow: (key: keyof ConfigSchema) => {
      if (key === "AUTH_BASE_URL") return "http://api.localhost.me:3001/v1";
      if (key === "GOOGLE_CALLBACK_URL")
        return "http://api.localhost.me:3001/v1/auth/google/callback";
      if (key === "RESERVED_TENANT_SUBDOMAINS") return ["auth", "api", "www"];
      throw new Error(`Missing config key ${key}`);
    },
  } as never;
}
