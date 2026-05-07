import type {
	DynamicModule,
	ForwardReference,
	INestApplication,
	ModuleMetadata,
	Provider,
	Type,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";

import { configureApp as defaultConfigApp } from "../src/configure-app";
import type { TestContainers } from "./test-containers";

type NestImport = Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference;

type ConfigAppFn = (app: INestApplication) => void | Promise<void>;

export class TestApp {
	private extraImports: NestImport[] = [];
	private providers: Provider[] = [];
	private controllers: Array<Type<any>> = [];
	private configureApp: ConfigAppFn = (app) => defaultConfigApp(app);
	private containerEnv: Record<string, string> | null = null;

	static builder(): TestApp {
		return new TestApp();
	}

	/**
	 * Injeta configuração dos containers Testcontainers (DB)
	 * nas variáveis de ambiente para o ConfigModule do NestJS.
	 *
	 * Seguro para execução paralela com pool: "forks" (cada arquivo
	 * roda em um processo separado com seu próprio process.env).
	 */
	withContainers(containers: TestContainers): this {
		this.containerEnv = containers.env;
		return this;
	}

	withImports(...imports: NestImport[]): this {
		this.extraImports.push(...imports);
		return this;
	}

	withProviders(...providers: Provider[]): this {
		this.providers.push(...providers);
		return this;
	}

	withControllers(...controllers: Array<Type<any>>): this {
		this.controllers.push(...controllers);
		return this;
	}

	withConfigApp(configure: ConfigAppFn | null): this {
		this.configureApp = configure ?? (async () => {});
		return this;
	}

	useRealCsrf(): this {
		this.configureApp = defaultConfigApp;
		return this;
	}

	withModuleMetadata(meta: Partial<ModuleMetadata>): this {
		if (meta.imports) this.extraImports.push(...(meta.imports as NestImport[]));
		if (meta.providers) this.providers.push(...meta.providers);
		return this;
	}

	async init(): Promise<INestApplication> {
		// Injeta env overrides ANTES de importar AppModule.
		// O decorator @Module do AppModule chama ConfigModule.forRoot() no momento
		// do import, que lê process.env. Por isso os overrides devem vir primeiro.
		if (this.containerEnv) {
			for (const [key, value] of Object.entries(this.containerEnv)) {
				process.env[key] = value;
			}
		}

		// Dynamic import: garante que AppModule (e ConfigModule.forRoot()) é
		// carregado DEPOIS dos env overrides. Com pool: "forks", cada child
		// process é limpo — o módulo ainda não foi importado.
		const { AppModule } = await import("../src/app.module.js");

		const moduleBuilder = Test.createTestingModule({
			imports: [AppModule, ...this.extraImports],
			providers: this.providers,
			controllers: this.controllers,
		});


		const moduleRef = await moduleBuilder.compile();
		const app = moduleRef.createNestApplication();

		app.enableShutdownHooks();

		await this.configureApp(app);
		await app.init();
		return app;
	}
}
