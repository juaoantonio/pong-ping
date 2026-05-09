import { ConfigService } from "@nestjs/config";
import supertest from "supertest";
import { DataSource } from "typeorm";
import { beforeAll, describe, expect, it, test, vi } from "vitest";
import { type ConfigSchema } from "../src/common/config/config.module";
import { setupE2e } from "./setup-e2e";
import { expectSuccessEnvelope } from "./utils/envelope-helpers";

describe("Testes de saúde da aplicação - e2e", () => {
  const ctx = setupE2e();

  describe("Usuário anônimo", () => {
    let healthResponse: supertest.Response;

    beforeAll(async () => {
      healthResponse = await ctx.agent.get("/v1/health");
    });

    it("Obtendo status healthy com dependências disponíveis", () => {
      expect(healthResponse.status).toBe(200);
      expectSuccessEnvelope(healthResponse.body);
      expect(healthResponse.body.data.status).toBe("healthy");
    });

    it("Retornando contrato de resposta completo", () => {
      const healthData = healthResponse.body.data;

      expect(healthData).toHaveProperty("updated_at");
      expect(healthData).toHaveProperty("application");
      expect(healthData.application).toEqual({
        version: expect.any(String),
        uptime_seconds: expect.any(Number),
        environment: expect.any(String),
      });
      expect(healthData.dependencies.database).toEqual({
        status: expect.any(String),
        engine: expect.any(String),
        version: expect.any(String),
        max_connections: expect.any(Number),
        opened_connections: expect.any(Number),
        latency_ms: expect.any(Number),
      });
    });

    test("Retornando dados da aplicação", () => {
      const configService = ctx.app.get<ConfigService<ConfigSchema>>(ConfigService);
      const expectedVersion = configService.get<string>("VERSION")!;
      const expectedEnvironment = configService.get<string>("NODE_ENV")!;

      const applicationInfo = healthResponse.body.data.application;
      expect(applicationInfo.version).toBe(expectedVersion);
      expect(applicationInfo.uptime_seconds).toBeGreaterThan(0);
      expect(applicationInfo.environment).toBe(expectedEnvironment);
    });

    describe("Retornando dados da dependência de banco de dados", () => {
      test("Quando está saudável", () => {
        const databaseInfo = healthResponse.body.data.dependencies.database;
        expect(databaseInfo.status).toBe("healthy");
        expect(databaseInfo.engine).toBe("postgres");

        expect(databaseInfo.opened_connections).toBeGreaterThanOrEqual(1);
        expect(databaseInfo.max_connections).toBeGreaterThanOrEqual(1);
        expect(databaseInfo.version).toMatch(/^\d+\.\d+/);
        expect(databaseInfo.latency_ms).toBeGreaterThanOrEqual(0);
      });

      test("Quando está indisponível", async () => {
        const realDataSource = ctx.app.get(DataSource);

        const querySpy = vi
          .spyOn(realDataSource, "query")
          .mockRejectedValue(new Error("Connection refused"));

        const isInitializedSpy = vi
          .spyOn(realDataSource, "isInitialized", "get")
          .mockReturnValue(false);

        const testAgent = supertest.agent(ctx.app.getHttpServer());
        const response = await testAgent.get("/v1/health");

        expect(response.status).toBe(503);
        expectSuccessEnvelope(response.body);
        expect(response.body.data.status).toBe("unhealthy");
        expect(response.body.data.dependencies.database.status).toBe("down");

        querySpy.mockRestore();
        isInitializedSpy.mockRestore();
      });
    });
  });
});
