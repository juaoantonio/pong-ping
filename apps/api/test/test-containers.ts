import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { RedisContainer, type StartedRedisContainer } from "@testcontainers/redis";

export interface ContainerConfig {
	dbHost: string;
	dbPort: number;
	dbUsername: string;
	dbPassword: string;
	dbDatabase: string;
	redisHost: string;
	redisPort: number;
}

/**
 * Gerencia containers Docker isolados por suite de teste via Testcontainers.
 *
 * Cada suite recebe seus próprios containers de PostgreSQL e Redis,
 * permitindo execução paralela sem conflitos de porta ou dados.
 *
 * @example
 * let containers: TestContainers;
 *
 * beforeAll(async () => {
 *   containers = await TestContainers.start();
 *   app = await TestApp.builder().withContainers(containers).init();
 * });
 *
 * afterAll(async () => {
 *   await app?.close();
 *   await containers?.stop();
 * });
 */
export class TestContainers {
	private constructor(
		private readonly postgres: StartedPostgreSqlContainer,
		private readonly redis: StartedRedisContainer,
	) {}

	static async start(): Promise<TestContainers> {
		const [postgres, redis] = await Promise.all([
			new PostgreSqlContainer("postgres:16-alpine")
				.withDatabase("fresh-app-db-test")
				.withUsername("fresh-app-user")
				.withPassword("fresh-app-password")
				.start(),
			new RedisContainer("redis:7-alpine").start(),
		]);

		return new TestContainers(postgres, redis);
	}

	get config(): ContainerConfig {
		return {
			dbHost: this.postgres.getHost(),
			dbPort: this.postgres.getMappedPort(5432),
			dbUsername: this.postgres.getUsername(),
			dbPassword: this.postgres.getPassword(),
			dbDatabase: this.postgres.getDatabase(),
			redisHost: this.redis.getHost(),
			redisPort: this.redis.getMappedPort(6379),
		};
	}

	/** Variáveis de ambiente para injetar no ConfigModule do NestJS. */
	get env(): Record<string, string> {
		const cfg = this.config;
		return {
			DB_HOST: cfg.dbHost,
			DB_PORT: String(cfg.dbPort),
			DB_USERNAME: cfg.dbUsername,
			DB_PASSWORD: cfg.dbPassword,
			DB_DATABASE: cfg.dbDatabase,
			REDIS_HOST: cfg.redisHost,
			REDIS_PORT: String(cfg.redisPort),
		};
	}

	async stop(): Promise<void> {
		await Promise.all([this.postgres.stop(), this.redis.stop()]);
	}
}
