import type { ExecutionContext } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import type { ConfigSchema } from "../../../common/config/config.module";
import { SystemGoogleOAuthGuard } from "./system-google-oauth.guard";

describe("SystemGoogleOAuthGuard", () => {
  it("uses the system OAuth callback URL without tenant context", () => {
    const guard = new SystemGoogleOAuthGuard(fakeConfig());

    expect(guard.getAuthenticateOptions(executionContext())).toMatchObject({
      callbackURL: "https://configured.example.test/v1/system/auth/google/callback",
    });
  });
});

function executionContext(): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          host: "internal.example.test",
          "x-forwarded-host": "api.example.test",
          "x-forwarded-proto": "https",
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
      if (key === "GOOGLE_CALLBACK_URL") return "https://configured.example.test/v1/auth/google/callback";
      throw new Error(`Missing config key ${key}`);
    },
  } as never;
}
