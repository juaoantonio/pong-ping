import { Controller, Get, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentContextService } from "../../common/context";
import {
  ApiErrorEnvelopeResponses,
  ApiSuccessEnvelopeResponse,
} from "../../common/shared/http/api-response.swagger";
import { RequireTenantRoles } from "../identity/authorization/authorization.decorators";
import { IDENTITY_TENANT_ROLE } from "../identity/identity-roles";
import { CoreDashboardSummaryDto } from "./presentation/http/dtos/core-dashboard-read.dtos";
import { CoreDashboardReadQuery } from "./presentation/http/queries/core-dashboard-read.query";

@ApiTags("dashboard")
@Controller("dashboard")
@RequireTenantRoles(IDENTITY_TENANT_ROLE.MEMBER, IDENTITY_TENANT_ROLE.ADMIN)
export class CoreDashboardReadController {
  public constructor(
    private readonly context: CurrentContextService,
    private readonly dashboard: CoreDashboardReadQuery,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get dashboard summary for the current core club" })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Dashboard summary.",
    data: CoreDashboardSummaryDto,
  })
  @ApiErrorEnvelopeResponses(
    { status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid session." },
    { status: HttpStatus.FORBIDDEN, description: "Tenant member role is required." },
  )
  public async getDashboard() {
    const tenant = this.context.getTenantOrThrow();

    return this.dashboard.getDashboard(tenant.id);
  }
}
