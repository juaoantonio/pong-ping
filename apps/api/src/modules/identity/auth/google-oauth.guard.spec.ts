import type { ExecutionContext } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import type { ConfigSchema } from "../../../common/config/config.module";
import type { CurrentContextService } from "../../../common/context";
import { GoogleOAuthGuard } from "./google-oauth.guard";

describe("GoogleOAuthGuard", () => {
  it("uses the tenant request host for the OAuth callback URL", () => {
    const guard = new GoogleOAuthGuard(
      { getTenantOrThrow: () => ({ id: "tenant-1", slug: "teste" }) } as never,
      fakeConfig(),
    );

    expect(guard.getAuthenticateOptions(executionContext())).toMatchObject({
      callbackURL: "http://teste.localhost:3001/v1/auth/google/callback",
    });
  });
});

function executionContext(): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          host: "teste.localhost:3001",
        },
        protocol: "http",
      }),
    }),
  } as ExecutionContext;
}

function fakeConfig() {
  return {
    getOrThrow: (key: keyof ConfigSchema) => {
      if (key === "API_PREFIX") return "v1";
      if (key === "GOOGLE_CALLBACK_URL") return "http://localhost:3001/v1/auth/google/callback";
      throw new Error(`Missing config key ${key}`);
    },
  } as never;
}
