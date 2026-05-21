import { Body, Controller, ForbiddenException, HttpStatus, Param, Patch } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CurrentContextService } from "../../../common/context";
import {
  ApiErrorEnvelopeResponses,
  ApiSuccessEnvelopeResponse,
} from "../../../common/shared/http/api-response.swagger";
import { RequireTenantRoles } from "../../identity/authorization/authorization.decorators";
import { IDENTITY_TENANT_ROLE } from "../../identity/identity-roles";
import { CoreIdentityTranslator } from "../application/identity";
import { DomainRuleViolation } from "../shared/domain";
import { UpdateAthleteProfileUseCase } from "./application/use-cases";
import { type Athlete } from "./domain";
import { AthleteRepository } from "./infrastructure/typeorm/repositories/athlete.repository";
import {
  AthleteResponseDto,
  UpdateAthleteProfileRequestDto,
} from "./presentation/http/dtos/athlete-command.dtos";
import { toAthleteResponse } from "./presentation/http/serializers/athlete-contract.serializer";

@ApiTags("athletes")
@Controller("athletes")
@RequireTenantRoles(IDENTITY_TENANT_ROLE.MEMBER, IDENTITY_TENANT_ROLE.ADMIN)
export class AthleteCommandController {
  public constructor(
    private readonly context: CurrentContextService,
    private readonly identity: CoreIdentityTranslator,
    private readonly athletes: AthleteRepository,
    private readonly updateAthleteProfile: UpdateAthleteProfileUseCase,
  ) {}

  @Patch(":athleteId/profile")
  @ApiOperation({ summary: "Update an athlete profile" })
  @ApiParam({ name: "athleteId", example: "athlete-1" })
  @ApiBody({ type: UpdateAthleteProfileRequestDto })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Athlete profile updated.",
    data: AthleteResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    { status: HttpStatus.BAD_REQUEST, description: "Validation failed or domain rule failed." },
    { status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid session." },
    { status: HttpStatus.FORBIDDEN, description: "Tenant member role is required." },
    { status: HttpStatus.NOT_FOUND, description: "Athlete was not found." },
  )
  public async updateProfile(
    @Param("athleteId") athleteId: string,
    @Body() body: UpdateAthleteProfileRequestDto,
  ) {
    const tenant = this.context.getTenantOrThrow();
    const currentAthlete = await this.currentAthlete();

    if (currentAthlete.id.value !== athleteId) {
      throw new ForbiddenException("Athlete profile can only be updated by its owner.");
    }

    const athlete = await this.updateAthleteProfile.execute({
      clubId: tenant.id,
      athleteId,
      displayName: body.displayName,
      profile: body.profile,
    });

    return toAthleteResponse(athlete);
  }

  private async currentAthlete(): Promise<Athlete> {
    const actorId = this.identity.toActorId(this.context.getPrincipalOrThrow());
    const athlete = await this.athletes.findByUserId(actorId);

    if (!athlete) {
      throw new DomainRuleViolation("athlete_not_found", "Current athlete was not found.");
    }

    return athlete;
  }
}
