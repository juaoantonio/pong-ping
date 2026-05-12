import { randomUUID } from "node:crypto";
import { Body, Controller, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CurrentContextService } from "../../../common/context";
import {
  ApiErrorEnvelopeResponses,
  ApiSuccessEnvelopeResponse,
} from "../../../common/shared/http/api-response.swagger";
import { RequireTenantRoles } from "../../identity/authorization/authorization.decorators";
import { IDENTITY_TENANT_ROLE } from "../../identity/identity-roles";
import { CoreIdentityTranslator } from "../application/identity";
import { RegisterAthleteUseCase, UpdateAthleteProfileUseCase } from "./application/use-cases";
import {
  AthleteResponseDto,
  RegisterAthleteRequestDto,
  UpdateAthleteProfileRequestDto,
} from "./presentation/http/dtos/athlete-command.dtos";
import { toAthleteResponse } from "./presentation/http/serializers/athlete-contract.serializer";

@ApiTags("core athletes")
@Controller("core/athletes")
@RequireTenantRoles(IDENTITY_TENANT_ROLE.MEMBER, IDENTITY_TENANT_ROLE.ADMIN)
export class AthleteCommandController {
  public constructor(
    private readonly context: CurrentContextService,
    private readonly identity: CoreIdentityTranslator,
    private readonly registerAthlete: RegisterAthleteUseCase,
    private readonly updateAthleteProfile: UpdateAthleteProfileUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: "Register the current identity as a core athlete" })
  @ApiBody({ type: RegisterAthleteRequestDto })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.CREATED,
    description: "Athlete registered.",
    data: AthleteResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    { status: HttpStatus.BAD_REQUEST, description: "Validation failed or domain rule failed." },
    { status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid session." },
    { status: HttpStatus.FORBIDDEN, description: "Tenant member role is required." },
    { status: HttpStatus.CONFLICT, description: "User already has an athlete registration." },
  )
  public async register(@Body() body: RegisterAthleteRequestDto) {
    const tenant = this.context.getTenantOrThrow();
    const principal = this.context.getPrincipalOrThrow();
    const userId = this.identity.toActorId(principal);
    const athlete = await this.registerAthlete.execute({
      id: randomUUID(),
      clubId: tenant.id,
      userId,
      displayName: body.displayName,
      profile: body.profile,
    });

    return toAthleteResponse(athlete);
  }

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
    const athlete = await this.updateAthleteProfile.execute({
      athleteId,
      displayName: body.displayName,
      profile: body.profile,
    });

    return toAthleteResponse(athlete);
  }
}
