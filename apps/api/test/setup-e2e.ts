import type { INestApplication } from "@nestjs/common";
import supertest from "supertest";
import type TestAgent from "supertest/lib/agent";
import { afterAll, beforeAll } from "vitest";
import { TestApp } from "./test-app";
import { TestContainers } from "./test-containers";

/**
 * Contexto compartilhado de uma suite E2E.
 *
 * Inclui containers Docker isolados (via Testcontainers), a aplicação NestJS,
 * agente HTTP (supertest) e utilitários de orquestração e autenticação.
 */
export interface E2eContext {
	containers: TestContainers;
	app: INestApplication;
	agent: TestAgent;
}

export interface SetupE2eOptions {
	/** Permite customizar o builder do TestApp antes da inicialização. */
	configureApp?: (builder: TestApp) => TestApp;
}

/**
 * Inicializa toda a infraestrutura E2E para uma suite de testes:
 * - Sobe containers isolados de PostgreSQL e Redis via Testcontainers
 * - Inicializa a aplicação NestJS conectada a esses containers
 * - Cria agente HTTP (supertest), Orchestrator e AuthTestHelper
 *
 * Registra automaticamente `beforeAll` e `afterAll` do Vitest para setup/teardown.
 *
 * @example
 * describe("Feature E2E", () => {
 *   const ctx = setupE2e();
 *
 *   beforeEach(async () => {
 *     await ctx.orchestrator.reset();
 *   });
 *
 *   test("...", async () => {
 *     const { token } = await ctx.authHelper.createAndLoginAsCustomer();
 *     const res = await ctx.agent.get("/v1/endpoint").set("Authorization", `Bearer ${token}`);
 *   });
 * });
 */
export function setupE2e(options?: SetupE2eOptions): E2eContext {
	// Objeto mutável — os campos são preenchidos no beforeAll
	const ctx = {} as E2eContext;

	beforeAll(async () => {
		ctx.containers = await TestContainers.start();

		let builder = TestApp.builder().withContainers(ctx.containers);
		if (options?.configureApp) {
			builder = options.configureApp(builder);
		}

		ctx.app = await builder.init();
		ctx.agent = supertest.agent(ctx.app.getHttpServer());
	});

	afterAll(async () => {
		await ctx.app?.close();
		await ctx.containers?.stop();
	});

	return ctx;
}
