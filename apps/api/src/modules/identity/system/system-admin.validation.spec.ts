import { BadRequestException } from "@nestjs/common";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";
import { IDENTITY_TENANT_ROLE } from "../identity-roles";
import {
  CreateSystemMembershipDto,
  CreateSystemTenantDto,
  UpdateSystemMembershipDto,
} from "./dtos/system-admin.dtos";
import {
  assertTenantRoles,
  assertTenantSlugAllowed,
  normalizeEmail,
} from "./system-admin.validation";

describe("system admin validation", () => {
  it("normalizes email and tenant slugs", () => {
    expect(normalizeEmail(" USER@example.TEST ")).toBe("user@example.test");
    expect(assertTenantSlugAllowed(" Acme-1 ", ["api"])).toBe("acme-1");
  });

  it("rejects invalid and reserved tenant slugs", () => {
    expect(() => assertTenantSlugAllowed("-bad", [])).toThrow(BadRequestException);
    expect(() => assertTenantSlugAllowed("api", ["api"])).toThrow(BadRequestException);
  });

  it("validates tenant create payloads", async () => {
    const dto = Object.assign(new CreateSystemTenantDto(), {
      name: "Acme",
      slug: "acme",
      ownerEmail: "owner@example.test",
      ownerRole: IDENTITY_TENANT_ROLE.ADMIN,
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it("rejects invalid emails and roles in DTOs", async () => {
    const tenantDto = Object.assign(new CreateSystemTenantDto(), {
      name: "Acme",
      slug: "acme",
      ownerEmail: "not-email",
      ownerRole: IDENTITY_TENANT_ROLE.MEMBER,
    });
    const membershipDto = Object.assign(new CreateSystemMembershipDto(), {
      email: "member@example.test",
      roles: [],
    });
    const updateDto = Object.assign(new UpdateSystemMembershipDto(), {
      roles: [IDENTITY_TENANT_ROLE.OWNER, "bad-role"],
    });

    expect(await validate(tenantDto)).not.toHaveLength(0);
    expect(await validate(membershipDto)).not.toHaveLength(0);
    expect(await validate(updateDto)).not.toHaveLength(0);
    expect(() => assertTenantRoles([])).toThrow(BadRequestException);
  });
});
