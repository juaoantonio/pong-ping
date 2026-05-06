import Joi from "joi";
import { describe, expect, it } from "vitest";
import { appSchema, corsSchema, databaseSchema } from "./config.module";

describe("config schema", () => {
  it("validates starter environment values", () => {
    const schema = Joi.object({
      ...appSchema,
      ...corsSchema,
      ...databaseSchema,
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
    });

    expect(result.error).toBeUndefined();
    expect(result.value.CORS_ORIGIN).toEqual(["http://localhost:3000"]);
  });
});
