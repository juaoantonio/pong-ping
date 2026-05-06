import type { DataSource } from "typeorm";

export async function truncatePublicTables(dataSource: DataSource) {
  const rows = (await dataSource.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename != 'migrations'
  `)) as Array<{ tablename: string }>;

  for (const row of rows) {
    await dataSource.query(`TRUNCATE TABLE "${row.tablename}" RESTART IDENTITY CASCADE`);
  }
}
