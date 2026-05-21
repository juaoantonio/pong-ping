import { Controller, Get, HttpStatus, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CurrentContextService } from "../../../common/context";
import {
  ApiErrorEnvelopeResponses,
  ApiSuccessEnvelopeResponse,
} from "../../../common/shared/http/api-response.swagger";
import { RequireTenantRoles } from "../../identity/authorization/authorization.decorators";
import { IDENTITY_TENANT_ROLE } from "../../identity/identity-roles";
import { CorePageQueryDto } from "../shared/presentation/http/dtos/core-page.dtos";
import { GameRecordResponseDto } from "./presentation/http/dtos/competition-command.dtos";
import { GameReadQuery } from "./presentation/http/queries/game-read.query";

@ApiTags("competitions")
@Controller("games")
@RequireTenantRoles(IDENTITY_TENANT_ROLE.MEMBER, IDENTITY_TENANT_ROLE.ADMIN)
export class CompetitionReadController {
  public constructor(
    private readonly context: CurrentContextService,
    private readonly query: GameReadQuery,
  ) {}

  @Get()
  @ApiOperation({ summary: "List game history for the current core club" })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Games listed.",
  })
  @ApiErrorEnvelopeResponses(
    { status: HttpStatus.BAD_REQUEST, description: "Validation failed." },
    { status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid session." },
    { status: HttpStatus.FORBIDDEN, description: "Tenant member role is required." },
  )
  public async list(@Query() page: CorePageQueryDto) {
    const tenant = this.context.getTenantOrThrow();

    return this.query.listGames(tenant.id, page);
  }

  @Get(":gameRecordId")
  @ApiOperation({ summary: "Get a game record for the current core club" })
  @ApiParam({ name: "gameRecordId", example: "game-1" })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Game detail.",
    data: GameRecordResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    { status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid session." },
    { status: HttpStatus.FORBIDDEN, description: "Tenant member role is required." },
    { status: HttpStatus.NOT_FOUND, description: "Game record was not found." },
  )
  public async detail(@Param("gameRecordId") gameRecordId: string) {
    const tenant = this.context.getTenantOrThrow();

    return this.query.getGame(tenant.id, gameRecordId);
  }
}
