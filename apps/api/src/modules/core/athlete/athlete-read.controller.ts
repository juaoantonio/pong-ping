import { Controller, Get, HttpStatus, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentContextService } from "../../../common/context";
import {
  ApiErrorEnvelopeResponses,
  ApiSuccessEnvelopeResponse,
} from "../../../common/shared/http/api-response.swagger";
import { RequireTenantRoles } from "../../identity/authorization/authorization.decorators";
import { IDENTITY_TENANT_ROLE } from "../../identity/identity-roles";
import { CorePageQueryDto } from "../shared/presentation/http/dtos/core-page.dtos";
import { AthleteResponseDto } from "./presentation/http/dtos/athlete-command.dtos";
import { AthleteReadQuery } from "./presentation/http/queries/athlete-read.query";

@ApiTags("core athletes")
@Controller("core/athletes")
@RequireTenantRoles(IDENTITY_TENANT_ROLE.MEMBER, IDENTITY_TENANT_ROLE.ADMIN)
export class AthleteReadController {
  public constructor(
    private readonly context: CurrentContextService,
    private readonly query: AthleteReadQuery,
  ) {}

  @Get("me")
  @ApiOperation({ summary: "Get current athlete for the current core club" })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Current athlete.",
    data: AthleteResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    { status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid session." },
    { status: HttpStatus.FORBIDDEN, description: "Tenant member role is required." },
    { status: HttpStatus.NOT_FOUND, description: "Current athlete was not found." },
  )
  public async me() {
    const tenant = this.context.getTenantOrThrow();
    const principal = this.context.getPrincipalOrThrow();

    return this.query.getCurrentAthlete(tenant.id, principal.userId);
  }

  @Get()
  @ApiOperation({ summary: "List athletes for the current core club" })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Athletes listed.",
  })
  @ApiErrorEnvelopeResponses(
    { status: HttpStatus.BAD_REQUEST, description: "Validation failed." },
    { status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid session." },
    { status: HttpStatus.FORBIDDEN, description: "Tenant member role is required." },
  )
  public async list(@Query() page: CorePageQueryDto) {
    const tenant = this.context.getTenantOrThrow();

    return this.query.listAthletes(tenant.id, page);
  }
}
