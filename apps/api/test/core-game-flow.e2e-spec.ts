import { DataSource } from "typeorm";
import { beforeEach, describe, expect, it } from "vitest";
import { IDENTITY_TENANT_ROLE } from "../src/modules/identity/identity-roles";
import { truncatePublicTables } from "./orchestrator";
import { setupE2e } from "./setup-e2e";
import { createTenant, createTenantSession, tenantRequest } from "./utils/core-e2e-helpers";
import { expectSuccessEnvelope } from "./utils/envelope-helpers";

describe("Fluxo de mesa e jogo core - e2e", () => {
  const ctx = setupE2e();

  beforeEach(async () => {
    await truncatePublicTables(ctx.app.get(DataSource));
  });

  it("executa fluxo essencial de mesa, jogo, historico e ranking", async () => {
    const tenant = await createTenant(ctx, "club");
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

    const createTableResponse = await tenantRequest(ctx, admin)
      .post("/v1/core/tables")
      .send({ name: "Mesa Central", playMode: "singles" })
      .expect(201);
    const tableId = createTableResponse.body.data.id as string;

    await tenantRequest(ctx, member).post(`/v1/core/tables/${tableId}/queue`).expect(201);
    await tenantRequest(ctx, admin).post(`/v1/core/tables/${tableId}/queue`).expect(201);

    const activeGameResponse = await tenantRequest(ctx, admin)
      .post(`/v1/core/tables/${tableId}/active-game`)
      .expect(201);

    expectSuccessEnvelope(activeGameResponse.body);
    expect(activeGameResponse.body.data.activeGame).toMatchObject({
      firstSide: { athleteIds: ["athlete-member"] },
      secondSide: { athleteIds: ["athlete-admin"] },
    });

    const recordResponse = await tenantRequest(ctx, admin)
      .post(`/v1/core/tables/${tableId}/games`)
      .send({ winningAthleteIds: ["athlete-admin"] })
      .expect(201);
    const gamesResponse = await tenantRequest(ctx, admin).get("/v1/core/games").expect(200);
    const rankingResponse = await tenantRequest(ctx, admin).get("/v1/core/ratings").expect(200);

    expectSuccessEnvelope(recordResponse.body);
    expect(recordResponse.body.data).toMatchObject({
      tableId,
      winningSide: { athleteIds: ["athlete-admin"] },
      losingSide: { athleteIds: ["athlete-member"] },
      actorAthleteId: "athlete-admin",
    });
    expect(gamesResponse.body.data.items[0]).toMatchObject({ id: recordResponse.body.data.id });
    expect(rankingResponse.body.data.items[0]).toMatchObject({
      athleteId: "athlete-admin",
      athleteDisplayName: "Admin Pong",
      wins: 1,
      totalMatches: 1,
      winRate: 100,
    });
  });
});
