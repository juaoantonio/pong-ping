import { Body, Controller, HttpStatus, Param, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CurrentContextService } from "../../../common/context";
import {
  ApiErrorEnvelopeResponses,
  ApiSuccessEnvelopeResponse,
} from "../../../common/shared/http/api-response.swagger";
import { RequireTenantRoles } from "../../identity/authorization/authorization.decorators";
import { IDENTITY_TENANT_ROLE } from "../../identity/identity-roles";
import { AthleteRepository } from "../athlete/infrastructure/typeorm/repositories/athlete.repository";
import { CoreIdentityTranslator } from "../application/identity";
import { ClubId } from "../club/domain";
import { DomainRuleViolation } from "../shared/domain";
import { WinningAthletesRequestDto } from "../table/presentation/http/dtos/table-command.dtos";
import { CorrectGameUseCase, RecordGameUseCase } from "./application/use-cases";
import { GameRecordResponseDto } from "./presentation/http/dtos/competition-command.dtos";
import { toGameRecordResponse } from "./presentation/http/serializers/competition-contract.serializer";

@ApiTags("competitions")
@Controller()
@RequireTenantRoles(IDENTITY_TENANT_ROLE.MEMBER, IDENTITY_TENANT_ROLE.ADMIN)
export class CompetitionCommandController {
  public constructor(
    private readonly context: CurrentContextService,
    private readonly identity: CoreIdentityTranslator,
    private readonly athletes: AthleteRepository,
    private readonly recordGame: RecordGameUseCase,
    private readonly correctGame: CorrectGameUseCase,
  ) {}

  @Post("tables/:tableId/games")
  @ApiOperation({ summary: "Record a finished game for a table" })
  @ApiParam({ name: "tableId", example: "table-1" })
  @ApiBody({ type: WinningAthletesRequestDto })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.CREATED,
    description: "Game recorded.",
    data: GameRecordResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    { status: HttpStatus.BAD_REQUEST, description: "Validation failed or domain rule failed." },
    { status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid session." },
    { status: HttpStatus.FORBIDDEN, description: "Tenant member role is required." },
    { status: HttpStatus.NOT_FOUND, description: "Table or current athlete was not found." },
  )
  public async record(@Param("tableId") tableId: string, @Body() body: WinningAthletesRequestDto) {
    const record = await this.recordGame.execute({
      tableId,
      winningAthleteIds: body.winningAthleteIds,
      actorAthleteId: await this.currentAthleteId(),
    });

    return toGameRecordResponse(record);
  }

  @Post("games/:gameRecordId/corrections")
  @RequireTenantRoles(IDENTITY_TENANT_ROLE.ADMIN)
  @ApiOperation({ summary: "Create a compensating correction for a game record" })
  @ApiParam({ name: "gameRecordId", example: "game-1" })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.CREATED,
    description: "Game correction recorded.",
    data: GameRecordResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    { status: HttpStatus.BAD_REQUEST, description: "Domain rule failed." },
    { status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid session." },
    { status: HttpStatus.FORBIDDEN, description: "Tenant admin role is required." },
    { status: HttpStatus.NOT_FOUND, description: "Game record or current athlete was not found." },
  )
  public async correct(@Param("gameRecordId") gameRecordId: string) {
    const correction = await this.correctGame.execute({
      gameRecordId,
      actorAthleteId: await this.currentAthleteId(),
    });

    return toGameRecordResponse(correction);
  }

  private async currentAthleteId(): Promise<string> {
    const tenant = this.context.getTenantOrThrow();
    const actorId = this.identity.toActorId(this.context.getPrincipalOrThrow());
    const athlete = await this.athletes.findByClubAndUserId(ClubId.from(tenant.id), actorId);

    if (!athlete) {
      throw new DomainRuleViolation("athlete_not_found", "Current athlete was not found.");
    }

    return athlete.id.value;
  }
}
