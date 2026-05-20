import { DataSource } from "typeorm";
import { beforeEach, describe, expect, it } from "vitest";
import { TableRepository } from "../src/modules/core/table/infrastructure/typeorm/repositories/table.repository";
import { IDENTITY_TENANT_ROLE } from "../src/modules/identity/identity-roles";
import { truncatePublicTables } from "./orchestrator";
import { setupE2e } from "./setup-e2e";
import {
  createTable,
  createTenant,
  createTenantSession,
  tenantRequest,
} from "./utils/core-e2e-helpers";
import { expectSuccessEnvelope } from "./utils/envelope-helpers";

describe("Leituras core do clube - e2e", () => {
  const ctx = setupE2e();

  beforeEach(async () => {
    await truncatePublicTables(ctx.app.get(DataSource));
  });

  it("lista apenas dados do tenant atual nas leituras do clube", async () => {
    const alpha = await createTenant(ctx, "alpha");
    const beta = await createTenant(ctx, "beta");
    const alphaAdmin = await createTenantSession(ctx, alpha, {
      athleteId: "alpha-athlete-1",
      displayName: "Alpha Admin",
      roles: [IDENTITY_TENANT_ROLE.ADMIN],
    });
    await createTenantSession(ctx, beta, {
      athleteId: "beta-athlete-1",
      displayName: "Beta Admin",
      roles: [IDENTITY_TENANT_ROLE.ADMIN],
    });
    const tables = ctx.app.get(TableRepository);
    await tables.save(createTable(alpha.id, "alpha-table", "Mesa Alpha", "alpha-athlete-1"));
    await tables.save(createTable(beta.id, "beta-table", "Mesa Beta", "beta-athlete-1"));

    const listResponse = await tenantRequest(ctx, alphaAdmin).get("/v1/core/tables").expect(200);
    const dashboardResponse = await tenantRequest(ctx, alphaAdmin)
      .get("/v1/core/dashboard")
      .expect(200);

    expectSuccessEnvelope(listResponse.body);
    expect(listResponse.body.data.items).toHaveLength(1);
    expect(listResponse.body.data.items[0]).toMatchObject({
      id: "alpha-table",
      clubId: alpha.id,
      name: "Mesa Alpha",
    });
    expectSuccessEnvelope(dashboardResponse.body);
    expect(dashboardResponse.body.data.tables).toMatchObject({
      totalTables: 1,
      activeTables: 0,
      queuedAthletes: 0,
    });
  });
});
