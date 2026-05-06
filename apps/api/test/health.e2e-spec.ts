import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestApp } from "./test-app";

describe("health", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("returns health in a success envelope", async () => {
    const response = await request(app.getHttpServer()).get("/v1/health").expect(200);

    expect(response.body.ok).toBe(true);
    expect(response.body.data.status).toBe("ok");
    expect(response.body.data.database.status).toBe("ok");
  });
});
