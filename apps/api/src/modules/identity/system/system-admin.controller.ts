import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RequireSystemRoles } from "../authorization/authorization.decorators";
import {
  CreateSystemMembershipDto,
  CreateSystemTenantDto,
  UpdateSystemMembershipDto,
  UpdateSystemTenantDto,
} from "./dtos/system-admin.dtos";
import { SystemAdminService } from "./system-admin.service";
import { SystemHostGuard } from "./system-host.guard";

@Controller("system/admin")
@UseGuards(SystemHostGuard)
@RequireSystemRoles("system_admin")
export class SystemAdminController {
  public constructor(private readonly systemAdmin: SystemAdminService) {}

  @Get("tenants")
  public listTenants() {
    return this.systemAdmin.listTenants();
  }

  @Post("tenants")
  public createTenant(@Body() body: CreateSystemTenantDto) {
    return this.systemAdmin.createTenant(body);
  }

  @Patch("tenants/:tenantId")
  public updateTenant(@Param("tenantId") tenantId: string, @Body() body: UpdateSystemTenantDto) {
    return this.systemAdmin.updateTenant(tenantId, body);
  }

  @Get("tenants/:tenantId/memberships")
  public listMemberships(@Param("tenantId") tenantId: string) {
    return this.systemAdmin.listMemberships(tenantId);
  }

  @Post("tenants/:tenantId/memberships")
  public createMembership(
    @Param("tenantId") tenantId: string,
    @Body() body: CreateSystemMembershipDto,
  ) {
    return this.systemAdmin.upsertMembership(tenantId, body);
  }

  @Patch("tenants/:tenantId/memberships/:membershipId")
  public updateMembership(
    @Param("tenantId") tenantId: string,
    @Param("membershipId") membershipId: string,
    @Body() body: UpdateSystemMembershipDto,
  ) {
    return this.systemAdmin.updateMembership(tenantId, membershipId, body);
  }

  @Delete("tenants/:tenantId/memberships/:membershipId")
  public async deactivateMembership(
    @Param("tenantId") tenantId: string,
    @Param("membershipId") membershipId: string,
  ) {
    await this.systemAdmin.deactivateMembership(tenantId, membershipId);
    return { deactivated: true };
  }
}
