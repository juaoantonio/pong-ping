import { getMetadataArgsStorage } from "typeorm";
import { describe, expect, it } from "vitest";
import {
  IDENTITY_ENTITIES,
  IdentitySessionEntity,
  IdentityUserEntity,
  SYSTEM_ROLES,
  SystemRoleAssignmentEntity,
  TENANT_ROLES,
  TenantEntity,
  TenantMembershipEntity,
} from ".";

function tableName(target: Function): string | undefined {
  return getMetadataArgsStorage().tables.find((table) => table.target === target)?.name;
}

function columnOptions(target: Function, propertyName: string) {
  return getMetadataArgsStorage().columns.find(
    (column) => column.target === target && column.propertyName === propertyName,
  )?.options;
}

function indicesFor(target: Function) {
  return getMetadataArgsStorage().indices.filter((index) => index.target === target);
}

function relationsFor(target: Function) {
  return getMetadataArgsStorage().relations.filter((relation) => relation.target === target);
}

function joinColumnName(target: Function, propertyName: string): string | undefined {
  return getMetadataArgsStorage().joinColumns.find(
    (joinColumn) => joinColumn.target === target && joinColumn.propertyName === propertyName,
  )?.name;
}

describe("identity entities", () => {
  it("declara entidades de identidade fora do dominio puro", () => {
    const targets = getMetadataArgsStorage().tables.map((table) => table.target);

    expect(IDENTITY_ENTITIES).toEqual([
      TenantEntity,
      IdentityUserEntity,
      TenantMembershipEntity,
      SystemRoleAssignmentEntity,
      IdentitySessionEntity,
    ]);
    expect(targets).toContain(TenantEntity);
    expect(targets).toContain(IdentityUserEntity);
    expect(targets).toContain(TenantMembershipEntity);
    expect(targets).toContain(SystemRoleAssignmentEntity);
    expect(targets).toContain(IdentitySessionEntity);
    expect(tableName(TenantEntity)).toBe("identity_tenants");
    expect(tableName(IdentityUserEntity)).toBe("identity_users");
    expect(tableName(TenantMembershipEntity)).toBe("identity_tenant_memberships");
    expect(tableName(SystemRoleAssignmentEntity)).toBe("identity_system_role_assignments");
    expect(tableName(IdentitySessionEntity)).toBe("identity_sessions");
  });

  it("persiste apenas hash de token de sessao", () => {
    const columns = getMetadataArgsStorage()
      .columns.filter((column) => column.target === IdentitySessionEntity)
      .map((column) => column.propertyName);

    expect(columns).toContain("tokenHash");
    expect(columns).not.toContain("token");
    expect(columns).not.toContain("rawToken");
    expect(columnOptions(IdentitySessionEntity, "tokenHash")).toMatchObject({
      name: "token_hash",
      type: "varchar",
      length: 128,
    });
  });

  it("permite usuarios pendentes e sessoes de sistema sem tenant", () => {
    expect(columnOptions(IdentityUserEntity, "googleSubject")).toMatchObject({
      name: "google_subject",
      nullable: true,
    });
    expect(columnOptions(IdentitySessionEntity, "tenantId")).toMatchObject({
      name: "tenant_id",
      nullable: true,
    });
    expect(relationsFor(IdentitySessionEntity)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          propertyName: "tenant",
          options: expect.objectContaining({ nullable: true }),
        }),
      ]),
    );
  });

  it("separa roles de sistema e tenant", () => {
    const membershipRoles = getMetadataArgsStorage().columns.find(
      (column) => column.target === TenantMembershipEntity && column.propertyName === "roles",
    );
    const systemRole = getMetadataArgsStorage().columns.find(
      (column) => column.target === SystemRoleAssignmentEntity && column.propertyName === "role",
    );

    expect(membershipRoles?.options).toMatchObject({
      type: "enum",
      enum: [...TENANT_ROLES],
      array: true,
    });
    expect(systemRole?.options).toMatchObject({
      type: "enum",
      enum: [...SYSTEM_ROLES],
    });
    expect(systemRole?.options.array).toBeUndefined();
  });

  it("declara indices e unicidade para consultas criticas", () => {
    expect(indicesFor(TenantEntity)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "ux_identity_tenants_slug", unique: true }),
        expect.objectContaining({ name: "ix_identity_tenants_active" }),
      ]),
    );
    expect(indicesFor(IdentityUserEntity)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "ux_identity_users_google_subject", unique: true }),
        expect.objectContaining({ name: "ux_identity_users_email", unique: true }),
        expect.objectContaining({ name: "ix_identity_users_active" }),
      ]),
    );
    expect(indicesFor(TenantMembershipEntity)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "ux_identity_tenant_memberships_tenant_user",
          unique: true,
        }),
        expect.objectContaining({ name: "ix_identity_tenant_memberships_tenant" }),
        expect.objectContaining({ name: "ix_identity_tenant_memberships_user" }),
        expect.objectContaining({ name: "ix_identity_tenant_memberships_active" }),
      ]),
    );
    expect(indicesFor(SystemRoleAssignmentEntity)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "ux_identity_system_role_assignments_user_role",
          unique: true,
        }),
        expect.objectContaining({ name: "ix_identity_system_role_assignments_user" }),
        expect.objectContaining({ name: "ix_identity_system_role_assignments_role" }),
      ]),
    );
    expect(indicesFor(IdentitySessionEntity)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "ux_identity_sessions_token_hash", unique: true }),
        expect.objectContaining({ name: "ix_identity_sessions_user_tenant" }),
        expect.objectContaining({ name: "ix_identity_sessions_expires_at" }),
        expect.objectContaining({ name: "ix_identity_sessions_revoked_at" }),
      ]),
    );
  });

  it("declara relacoes por colunas de join explicitas", () => {
    expect(relationsFor(TenantMembershipEntity)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ propertyName: "tenant", relationType: "many-to-one" }),
        expect.objectContaining({ propertyName: "user", relationType: "many-to-one" }),
      ]),
    );
    expect(joinColumnName(TenantMembershipEntity, "tenant")).toBe("tenant_id");
    expect(joinColumnName(TenantMembershipEntity, "user")).toBe("user_id");

    expect(relationsFor(SystemRoleAssignmentEntity)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ propertyName: "user", relationType: "many-to-one" }),
      ]),
    );
    expect(joinColumnName(SystemRoleAssignmentEntity, "user")).toBe("user_id");

    expect(relationsFor(IdentitySessionEntity)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ propertyName: "user", relationType: "many-to-one" }),
        expect.objectContaining({ propertyName: "tenant", relationType: "many-to-one" }),
      ]),
    );
    expect(joinColumnName(IdentitySessionEntity, "user")).toBe("user_id");
    expect(joinColumnName(IdentitySessionEntity, "tenant")).toBe("tenant_id");
  });
});
