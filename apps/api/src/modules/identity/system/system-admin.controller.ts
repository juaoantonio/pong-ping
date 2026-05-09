import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import {
  ApiErrorEnvelopeResponses,
  ApiSuccessEnvelopeResponse,
} from "../../../common/shared/http/api-response.swagger";
import { RequireSystemRoles } from "../authorization/authorization.decorators";
import { IDENTITY_SYSTEM_ROLE } from "../identity-roles";
import {
  CreateSystemMembershipRequestDto,
  CreateSystemTenantRequestDto,
  SystemMembershipDeactivationResponseDto,
  SystemMembershipResponseDto,
  SystemTenantResponseDto,
  UpdateSystemMembershipRequestDto,
  UpdateSystemTenantRequestDto,
} from "./dtos/system-admin.dtos";
import { SystemAdminService } from "./system-admin.service";
import { SystemHostGuard } from "./system-host.guard";

@ApiTags("system admin")
@Controller("system/admin")
@UseGuards(SystemHostGuard)
@RequireSystemRoles(IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN)
export class SystemAdminController {
  public constructor(private readonly systemAdmin: SystemAdminService) {}

  @Get("tenants")
  @ApiOperation({
    summary: "List tenants",
    description: "Requires a valid session cookie with the system administrator role.",
  })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Tenants ordered by newest first.",
    data: [SystemTenantResponseDto],
  })
  @ApiErrorEnvelopeResponses(
    {
      status: HttpStatus.UNAUTHORIZED,
      description: "Missing or invalid session cookie.",
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: "System host or system administrator role is required.",
    },
  )
  public listTenants() {
    return this.systemAdmin.listTenants();
  }

  @Post("tenants")
  @ApiOperation({
    summary: "Create a tenant",
    description:
      "Creates a tenant and initial owner/admin membership. Requires the system administrator role.",
  })
  @ApiBody({ type: CreateSystemTenantRequestDto })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.CREATED,
    description: "Tenant created.",
    data: SystemTenantResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    {
      status: HttpStatus.BAD_REQUEST,
      description: "Validation failed or tenant slug is reserved.",
    },
    {
      status: HttpStatus.UNAUTHORIZED,
      description: "Missing or invalid session cookie.",
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: "System host or system administrator role is required.",
    },
    {
      status: HttpStatus.CONFLICT,
      description: "Tenant slug or owner email conflicts with existing records.",
    },
  )
  public createTenant(@Body() body: CreateSystemTenantRequestDto) {
    return this.systemAdmin.createTenant(body);
  }

  @Patch("tenants/:tenantId")
  @ApiOperation({
    summary: "Update a tenant",
    description: "Requires a valid session cookie with the system administrator role.",
  })
  @ApiParam({
    name: "tenantId",
    description: "Tenant id.",
    example: "018f08f1-54a7-7181-8d75-59336a3a6e2b",
  })
  @ApiBody({ type: UpdateSystemTenantRequestDto })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Tenant updated.",
    data: SystemTenantResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    {
      status: HttpStatus.BAD_REQUEST,
      description: "Validation failed or no tenant fields were provided.",
    },
    {
      status: HttpStatus.UNAUTHORIZED,
      description: "Missing or invalid session cookie.",
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: "System host or system administrator role is required.",
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: "Tenant was not found.",
    },
    {
      status: HttpStatus.CONFLICT,
      description: "Tenant slug is already in use.",
    },
  )
  public updateTenant(
    @Param("tenantId") tenantId: string,
    @Body() body: UpdateSystemTenantRequestDto,
  ) {
    return this.systemAdmin.updateTenant(tenantId, body);
  }

  @Get("tenants/:tenantId/memberships")
  @ApiOperation({
    summary: "List tenant memberships",
    description: "Requires a valid session cookie with the system administrator role.",
  })
  @ApiParam({
    name: "tenantId",
    description: "Tenant id.",
    example: "018f08f1-54a7-7181-8d75-59336a3a6e2b",
  })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Tenant memberships ordered by oldest first.",
    data: [SystemMembershipResponseDto],
  })
  @ApiErrorEnvelopeResponses(
    {
      status: HttpStatus.UNAUTHORIZED,
      description: "Missing or invalid session cookie.",
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: "System host or system administrator role is required.",
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: "Tenant was not found.",
    },
  )
  public listMemberships(@Param("tenantId") tenantId: string) {
    return this.systemAdmin.listMemberships(tenantId);
  }

  @Post("tenants/:tenantId/memberships")
  @ApiOperation({
    summary: "Create or reactivate a tenant membership",
    description:
      "Creates a pending user if needed, or updates/reactivates an existing membership for the email.",
  })
  @ApiParam({
    name: "tenantId",
    description: "Tenant id.",
    example: "018f08f1-54a7-7181-8d75-59336a3a6e2b",
  })
  @ApiBody({ type: CreateSystemMembershipRequestDto })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.CREATED,
    description: "Membership created, updated, or reactivated.",
    data: SystemMembershipResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    {
      status: HttpStatus.BAD_REQUEST,
      description: "Validation failed or membership roles are invalid.",
    },
    {
      status: HttpStatus.UNAUTHORIZED,
      description: "Missing or invalid session cookie.",
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: "System host or system administrator role is required.",
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: "Tenant was not found.",
    },
  )
  public createMembership(
    @Param("tenantId") tenantId: string,
    @Body() body: CreateSystemMembershipRequestDto,
  ) {
    return this.systemAdmin.upsertMembership(tenantId, body);
  }

  @Patch("tenants/:tenantId/memberships/:membershipId")
  @ApiOperation({
    summary: "Update a tenant membership",
    description: "Requires a valid session cookie with the system administrator role.",
  })
  @ApiParam({
    name: "tenantId",
    description: "Tenant id.",
    example: "018f08f1-54a7-7181-8d75-59336a3a6e2b",
  })
  @ApiParam({
    name: "membershipId",
    description: "Tenant membership id.",
    example: "018f08f1-62d5-7931-9b7c-3a7e08063f15",
  })
  @ApiBody({ type: UpdateSystemMembershipRequestDto })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Membership updated.",
    data: SystemMembershipResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    {
      status: HttpStatus.BAD_REQUEST,
      description:
        "Validation failed, no membership fields were provided, or tenant would lose all admins.",
    },
    {
      status: HttpStatus.UNAUTHORIZED,
      description: "Missing or invalid session cookie.",
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: "System host or system administrator role is required.",
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: "Tenant or membership was not found.",
    },
  )
  public updateMembership(
    @Param("tenantId") tenantId: string,
    @Param("membershipId") membershipId: string,
    @Body() body: UpdateSystemMembershipRequestDto,
  ) {
    return this.systemAdmin.updateMembership(tenantId, membershipId, body);
  }

  @Delete("tenants/:tenantId/memberships/:membershipId")
  @ApiOperation({
    summary: "Deactivate a tenant membership",
    description: "Requires a valid session cookie with the system administrator role.",
  })
  @ApiParam({
    name: "tenantId",
    description: "Tenant id.",
    example: "018f08f1-54a7-7181-8d75-59336a3a6e2b",
  })
  @ApiParam({
    name: "membershipId",
    description: "Tenant membership id.",
    example: "018f08f1-62d5-7931-9b7c-3a7e08063f15",
  })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Membership deactivated.",
    data: SystemMembershipDeactivationResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    {
      status: HttpStatus.BAD_REQUEST,
      description: "Tenant would lose all active owner/admin memberships.",
    },
    {
      status: HttpStatus.UNAUTHORIZED,
      description: "Missing or invalid session cookie.",
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: "System host or system administrator role is required.",
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: "Tenant or membership was not found.",
    },
  )
  public async deactivateMembership(
    @Param("tenantId") tenantId: string,
    @Param("membershipId") membershipId: string,
  ) {
    await this.systemAdmin.deactivateMembership(tenantId, membershipId);
    return { deactivated: true };
  }
}
