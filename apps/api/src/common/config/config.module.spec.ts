import Joi from "joi";
import { describe, expect, it } from "vitest";
import { appSchema, corsSchema, databaseSchema, identityAuthSchema } from "./config.module";

describe("schema de configuracao", () => {
  it("valida valores iniciais de ambiente", () => {
    const schema = Joi.object({
      ...appSchema,
      ...corsSchema,
      ...databaseSchema,
      ...identityAuthSchema,
    });
    const result = schema.validate({
      NODE_ENV: "test",
      VERSION: "0.1.0",
      HOST: "127.0.0.1",
      PORT: 3000,
      API_PREFIX: "v1",
      CORS_ORIGIN: '["http://localhost:3000"]',
      DB_HOST: "127.0.0.1",
      DB_PORT: 5432,
      DB_USERNAME: "postgres",
      DB_PASSWORD: "postgres",
      DB_DATABASE: "app",
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
      GOOGLE_CALLBACK_URL: "http://localhost:3001/v1/auth/google/callback",
      SESSION_SECRET: "a".repeat(32),
    });

    expect(result.error).toBeUndefined();
    expect(result.value.CORS_ORIGIN).toEqual(["http://localhost:3000"]);
    expect(result.value.SESSION_COOKIE_NAME).toBe("pong_ping_session");
    expect(result.value.SESSION_TTL_SECONDS).toBe(60 * 60 * 24 * 14);
    expect(result.value.ROOT_DOMAIN).toBe("localhost");
    expect(result.value.RESERVED_TENANT_SUBDOMAINS).toEqual(["api", "www"]);
  });

  it("exige secrets de oauth e sessao", () => {
    const schema = Joi.object(identityAuthSchema);

    const result = schema.validate({}, { abortEarly: false });

    expect(result.error?.details.map((detail) => detail.path.join("."))).toEqual([
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_CALLBACK_URL",
      "SESSION_SECRET",
    ]);
  });
});
