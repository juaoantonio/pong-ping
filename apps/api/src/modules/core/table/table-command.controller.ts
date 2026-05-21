import { randomUUID } from "node:crypto";
import { Body, Controller, Delete, HttpStatus, Param, Patch, Post } from "@nestjs/common";
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
import { DomainRuleViolation } from "../shared/domain";
import {
  CreateTableUseCase,
  EnqueueTableUseCase,
  FormActiveGameUseCase,
  RemoveFromActiveGameUseCase,
  RemoveFromQueueUseCase,
  RenameTableUseCase,
  RotateWinnerStaysUseCase,
} from "./application/use-cases";
import {
  ActiveGameResponseDto,
  CreateTableRequestDto,
  RenameTableRequestDto,
  TableActiveGameCommandResponseDto,
  TableQueueEntryCommandResponseDto,
  TableResponseDto,
  WinningAthletesRequestDto,
} from "./presentation/http/dtos/table-command.dtos";
import {
  toActiveGameResponse,
  toQueueEntryResponse,
  toTableResponse,
} from "./presentation/http/serializers/table-contract.serializer";

@ApiTags("tables")
@Controller("tables")
@RequireTenantRoles(IDENTITY_TENANT_ROLE.MEMBER, IDENTITY_TENANT_ROLE.ADMIN)
export class TableCommandController {
  public constructor(
    private readonly context: CurrentContextService,
    private readonly identity: CoreIdentityTranslator,
    private readonly athletes: AthleteRepository,
    private readonly createTable: CreateTableUseCase,
    private readonly renameTable: RenameTableUseCase,
    private readonly enqueueTable: EnqueueTableUseCase,
    private readonly removeFromQueue: RemoveFromQueueUseCase,
    private readonly removeFromActiveGame: RemoveFromActiveGameUseCase,
    private readonly formActiveGame: FormActiveGameUseCase,
    private readonly rotateWinnerStays: RotateWinnerStaysUseCase,
  ) {}

  @Post()
  @RequireTenantRoles(IDENTITY_TENANT_ROLE.ADMIN)
  @ApiOperation({ summary: "Create a table for the current core club" })
  @ApiBody({ type: CreateTableRequestDto })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.CREATED,
    description: "Table created.",
    data: TableResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    { status: HttpStatus.BAD_REQUEST, description: "Validation failed or domain rule failed." },
    { status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid session." },
    { status: HttpStatus.FORBIDDEN, description: "Tenant admin role is required." },
    { status: HttpStatus.NOT_FOUND, description: "Current athlete was not found." },
  )
  public async create(@Body() body: CreateTableRequestDto) {
    const tenant = this.context.getTenantOrThrow();
    const createdByAthleteId = await this.currentAthleteId();
    const table = await this.createTable.execute({
      id: randomUUID(),
      clubId: tenant.id,
      name: body.name,
      playMode: body.playMode,
      createdByAthleteId,
    });

    return toTableResponse(table);
  }

  @Patch(":tableId/name")
  @RequireTenantRoles(IDENTITY_TENANT_ROLE.ADMIN)
  @ApiOperation({ summary: "Rename a table" })
  @ApiParam({ name: "tableId", example: "table-1" })
  @ApiBody({ type: RenameTableRequestDto })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Table renamed.",
    data: TableResponseDto,
  })
  public async rename(@Param("tableId") tableId: string, @Body() body: RenameTableRequestDto) {
    const table = await this.renameTable.execute({ tableId, name: body.name });

    return toTableResponse(table);
  }

  @Post(":tableId/queue")
  @ApiOperation({ summary: "Enqueue the current athlete on a table" })
  @ApiParam({ name: "tableId", example: "table-1" })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.CREATED,
    description: "Athlete enqueued.",
    data: TableQueueEntryCommandResponseDto,
  })
  public async enqueue(@Param("tableId") tableId: string) {
    const output = await this.enqueueTable.execute({
      tableId,
      athleteId: await this.currentAthleteId(),
    });

    return {
      table: toTableResponse(output.table),
      queueEntry: toQueueEntryResponse(output.queueEntry),
      membershipCreated: output.membershipCreated,
    };
  }

  @Delete(":tableId/queue/:athleteId")
  @ApiOperation({ summary: "Remove an athlete from the table queue" })
  @ApiParam({ name: "tableId", example: "table-1" })
  @ApiParam({ name: "athleteId", example: "athlete-1" })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Queued athlete removed.",
    data: TableQueueEntryCommandResponseDto,
  })
  public async removeQueued(
    @Param("tableId") tableId: string,
    @Param("athleteId") athleteId: string,
  ) {
    const output = await this.removeFromQueue.execute({ tableId, athleteId });

    return {
      table: toTableResponse(output.table),
      queueEntry: toQueueEntryResponse(output.removedEntry),
    };
  }

  @Delete(":tableId/active-game/:athleteId")
  @ApiOperation({ summary: "Remove an athlete from the active game" })
  @ApiParam({ name: "tableId", example: "table-1" })
  @ApiParam({ name: "athleteId", example: "athlete-1" })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Active athlete removed.",
    data: TableQueueEntryCommandResponseDto,
  })
  public async removeActive(
    @Param("tableId") tableId: string,
    @Param("athleteId") athleteId: string,
  ) {
    const output = await this.removeFromActiveGame.execute({ tableId, athleteId });

    return {
      table: toTableResponse(output.table),
      queueEntry: toQueueEntryResponse(output.removedEntry),
    };
  }

  @Post(":tableId/active-game")
  @ApiOperation({ summary: "Form an active game from the table queue" })
  @ApiParam({ name: "tableId", example: "table-1" })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.CREATED,
    description: "Active game formed.",
    data: TableActiveGameCommandResponseDto,
    extraModels: [ActiveGameResponseDto],
  })
  public async formGame(@Param("tableId") tableId: string) {
    const output = await this.formActiveGame.execute({ tableId });

    return {
      table: toTableResponse(output.table),
      activeGame: toActiveGameResponse(output.activeGame),
    };
  }

  @Post(":tableId/rotate-winner-stays")
  @ApiOperation({ summary: "Rotate the table queue with winner-stays ordering" })
  @ApiParam({ name: "tableId", example: "table-1" })
  @ApiBody({ type: WinningAthletesRequestDto })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.CREATED,
    description: "Queue rotated.",
    data: TableActiveGameCommandResponseDto,
  })
  public async rotateWinner(
    @Param("tableId") tableId: string,
    @Body() body: WinningAthletesRequestDto,
  ) {
    const output = await this.rotateWinnerStays.execute({
      tableId,
      winningAthleteIds: body.winningAthleteIds,
    });

    return {
      table: toTableResponse(output.table),
      activeGame: toActiveGameResponse(output.activeGame),
    };
  }

  private async currentAthleteId(): Promise<string> {
    const actorId = this.identity.toActorId(this.context.getPrincipalOrThrow());
    const athlete = await this.athletes.findByUserId(actorId);

    if (!athlete) {
      throw new DomainRuleViolation("athlete_not_found", "Current athlete was not found.");
    }

    return athlete.id.value;
  }
}
