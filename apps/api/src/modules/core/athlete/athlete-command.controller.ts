import { Body, Controller, HttpStatus, Param, Patch } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import {
  ApiErrorEnvelopeResponses,
  ApiSuccessEnvelopeResponse,
} from "../../../common/shared/http/api-response.swagger";
import { RequireTenantRoles } from "../../identity/authorization/authorization.decorators";
import { IDENTITY_TENANT_ROLE } from "../../identity/identity-roles";
import { UpdateAthleteProfileUseCase } from "./application/use-cases";
import {
  AthleteResponseDto,
  UpdateAthleteProfileRequestDto,
} from "./presentation/http/dtos/athlete-command.dtos";
import { toAthleteResponse } from "./presentation/http/serializers/athlete-contract.serializer";

@ApiTags("athletes")
@Controller("athletes")
@RequireTenantRoles(IDENTITY_TENANT_ROLE.MEMBER, IDENTITY_TENANT_ROLE.ADMIN)
export class AthleteCommandController {
  public constructor(private readonly updateAthleteProfile: UpdateAthleteProfileUseCase) {}

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
