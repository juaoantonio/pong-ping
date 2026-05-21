import { DataSource } from "typeorm";
import { beforeEach, describe, expect, it } from "vitest";
import { IDENTITY_TENANT_ROLE } from "../src/modules/identity/identity-roles";
import { truncatePublicTables } from "./orchestrator";
import { setupE2e } from "./setup-e2e";
import { createTenant, createTenantSession, tenantRequest } from "./utils/core-e2e-helpers";
import { expectErrorEnvelope, expectSuccessEnvelope } from "./utils/envelope-helpers";

describe("Autorizacao core do clube - e2e", () => {
  const ctx = setupE2e();

  beforeEach(async () => {
    await truncatePublicTables(ctx.app.get(DataSource));
  });

  it("restringe comandos administrativos a admins do tenant", async () => {
    const tenant = await createTenant(ctx, "locked");
    const admin = await createTenantSession(ctx, tenant, {
      athleteId: "athlete-admin",
      displayName: "Admin Pong",
      roles: [IDENTITY_TENANT_ROLE.ADMIN],
    });
    const member = await createTenantSession(ctx, tenant, {
      athleteId: "athlete-member",
      displayName: "Member Pong",
      roles: [IDENTITY_TENANT_ROLE.MEMBER],
    });

    const deniedResponse = await tenantRequest(ctx, member)
      .post("/v1/tables")
      .send({ name: "Mesa Negada", playMode: "singles" })
      .expect(403);
    const allowedResponse = await tenantRequest(ctx, admin)
      .post("/v1/tables")
      .send({ name: "Mesa Permitida", playMode: "singles" })
      .expect(201);

    expectErrorEnvelope(deniedResponse.body);
    expectSuccessEnvelope(allowedResponse.body);
    expect(allowedResponse.body.data).toMatchObject({
      name: "Mesa Permitida",
      createdByAthleteId: "athlete-admin",
    });
  });
});
