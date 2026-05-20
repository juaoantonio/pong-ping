import { randomUUID } from "node:crypto";
import { DataSource } from "typeorm";
import { ActorId } from "../../src/modules/core/shared/domain";
import { Athlete, AthleteDisplayName, AthleteId } from "../../src/modules/core/athlete/domain";
import { AthleteRepository } from "../../src/modules/core/athlete/infrastructure/typeorm/repositories/athlete.repository";
import { ClubId } from "../../src/modules/core/club/domain";
import { PlayMode, Table, TableId, TableName } from "../../src/modules/core/table/domain";
import {
  IdentityUserEntity,
  TenantEntity,
  TenantMembershipEntity,
} from "../../src/modules/identity/entities";
import type { IdentityTenantRole } from "../../src/modules/identity/identity-roles";
import { SessionCookieService } from "../../src/modules/identity/session/session-cookie.service";
import { SessionService } from "../../src/modules/identity/session/session.service";
import type { E2eContext } from "../setup-e2e";

export type TenantSessionFixture = {
  athleteId: string;
  cookie: string;
  tenant: TenantEntity;
  user: IdentityUserEntity;
};

export async function createTenant(ctx: E2eContext, slug: string) {
  const tenants = ctx.app.get(DataSource).getRepository(TenantEntity);

  return tenants.save(
    tenants.create({
      active: true,
      name: `Tenant ${slug}`,
      slug,
    }),
  );
}

export async function createTenantSession(
  ctx: E2eContext,
  tenant: TenantEntity,
  input: {
    athleteId: string;
    displayName: string;
    roles: IdentityTenantRole[];
  },
): Promise<TenantSessionFixture> {
  const dataSource = ctx.app.get(DataSource);
  const users = dataSource.getRepository(IdentityUserEntity);
  const memberships = dataSource.getRepository(TenantMembershipEntity);
  const user = await users.save(
    users.create({
      active: true,
      avatarUrl: null,
      displayName: input.displayName,
      email: `${randomUUID()}@example.test`,
      googleSubject: randomUUID(),
    }),
  );
  await memberships.save(
    memberships.create({
      active: true,
      roles: input.roles,
      tenantId: tenant.id,
      userId: user.id,
    }),
  );

  await ctx.app.get(AthleteRepository).save(
    Athlete.register({
      id: new AthleteId(input.athleteId),
      clubId: new ClubId(tenant.id),
      userId: new ActorId(user.id),
      displayName: new AthleteDisplayName(input.displayName),
    }),
  );

  const session = await ctx.app.get(SessionService).createTenantSession({
    tenantId: tenant.id,
    userId: user.id,
  });
  const cookieName = ctx.app.get(SessionCookieService).getTenantSessionCookieName(tenant.slug);

  return {
    athleteId: input.athleteId,
    cookie: `${cookieName}=${encodeURIComponent(session.token)}`,
    tenant,
    user,
  };
}

export function createTable(clubId: string, id: string, name: string, createdByAthleteId: string) {
  return Table.create({
    id: new TableId(id),
    clubId: new ClubId(clubId),
    name: new TableName(name),
    playMode: new PlayMode("singles"),
    createdByAthleteId: new AthleteId(createdByAthleteId),
    createdAt: new Date("2026-05-20T10:00:00.000Z"),
  });
}

export function tenantRequest(ctx: E2eContext, fixture: TenantSessionFixture) {
  const withTenantHeaders = <T extends { set(name: string, value: string): T }>(request: T) =>
    request.set("Host", `${fixture.tenant.slug}.localhost.me`).set("Cookie", fixture.cookie);

  return {
    get: (url: string) => withTenantHeaders(ctx.agent.get(url)),
    post: (url: string) => withTenantHeaders(ctx.agent.post(url)),
  };
}
