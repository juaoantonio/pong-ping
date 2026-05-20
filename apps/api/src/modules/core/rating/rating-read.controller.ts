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
import { RatingReadQuery } from "./presentation/http/queries/rating-read.query";

@ApiTags("core ratings")
@Controller("core/ratings")
@RequireTenantRoles(IDENTITY_TENANT_ROLE.MEMBER, IDENTITY_TENANT_ROLE.ADMIN)
export class RatingReadController {
  public constructor(
    private readonly context: CurrentContextService,
    private readonly query: RatingReadQuery,
  ) {}

  @Get()
  @ApiOperation({ summary: "List ratings for the current core club" })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Ratings listed.",
  })
  @ApiErrorEnvelopeResponses(
    { status: HttpStatus.BAD_REQUEST, description: "Validation failed." },
    { status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid session." },
    { status: HttpStatus.FORBIDDEN, description: "Tenant member role is required." },
  )
  public async list(@Query() page: CorePageQueryDto) {
    const tenant = this.context.getTenantOrThrow();

    return this.query.listRatings(tenant.id, page);
  }
}
