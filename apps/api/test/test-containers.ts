import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";

export async function startPostgresContainer(): Promise<StartedPostgreSqlContainer> {
  return new PostgreSqlContainer("postgres:17-alpine")
    .withDatabase("api_test")
    .withUsername("api")
    .withPassword("api_password")
    .start();
}
