import { Controller, Get, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentContextService } from "../../../common/context";
import {
  ApiErrorEnvelopeResponses,
  ApiSuccessEnvelopeResponse,
} from "../../../common/shared/http/api-response.swagger";
import { RequireTenantRoles } from "../../identity/authorization/authorization.decorators";
import { IDENTITY_TENANT_ROLE } from "../../identity/identity-roles";
import { ClubResponseDto } from "./presentation/http/dtos/club-command.dtos";
import { ClubReadQuery } from "./presentation/http/queries/club-read.query";

@ApiTags("club")
@Controller("club")
@RequireTenantRoles(IDENTITY_TENANT_ROLE.MEMBER, IDENTITY_TENANT_ROLE.ADMIN)
export class ClubReadController {
  public constructor(
    private readonly context: CurrentContextService,
    private readonly query: ClubReadQuery,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get the current club" })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Current club.",
    data: ClubResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    { status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid session." },
    { status: HttpStatus.FORBIDDEN, description: "Tenant member role is required." },
    { status: HttpStatus.NOT_FOUND, description: "Club was not found." },
  )
  public async current() {
    const tenant = this.context.getTenantOrThrow();

    return this.query.getCurrentClub(tenant.id);
  }
}
