import { Body, Controller, HttpStatus, Patch, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentContextService } from "../../../common/context";
import {
  ApiErrorEnvelopeResponses,
  ApiSuccessEnvelopeResponse,
} from "../../../common/shared/http/api-response.swagger";
import { RequireTenantRoles } from "../../identity/authorization/authorization.decorators";
import { IDENTITY_TENANT_ROLE } from "../../identity/identity-roles";
import {
  ActivateClubUseCase,
  ChangeClubSlugUseCase,
  CreateClubUseCase,
  DeactivateClubUseCase,
  RenameClubUseCase,
} from "./application/use-cases";
import {
  ChangeClubSlugRequestDto,
  ClubResponseDto,
  CreateClubRequestDto,
  RenameClubRequestDto,
} from "./presentation/http/dtos/club-command.dtos";
import { toClubResponse } from "./presentation/http/serializers/club-contract.serializer";

@ApiTags("core clubs")
@Controller("core/clubs")
@RequireTenantRoles(IDENTITY_TENANT_ROLE.ADMIN)
export class ClubCommandController {
  public constructor(
    private readonly context: CurrentContextService,
    private readonly createClub: CreateClubUseCase,
    private readonly renameClub: RenameClubUseCase,
    private readonly changeClubSlug: ChangeClubSlugUseCase,
    private readonly activateClub: ActivateClubUseCase,
    private readonly deactivateClub: DeactivateClubUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create the current tenant core club" })
  @ApiBody({ type: CreateClubRequestDto })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.CREATED,
    description: "Core club created.",
    data: ClubResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    { status: HttpStatus.BAD_REQUEST, description: "Validation failed or domain rule failed." },
    { status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid session." },
    { status: HttpStatus.FORBIDDEN, description: "Tenant admin role is required." },
    { status: HttpStatus.CONFLICT, description: "Club slug already exists." },
  )
  public async create(@Body() body: CreateClubRequestDto) {
    const tenant = this.context.getTenantOrThrow();
    const club = await this.createClub.execute({
      id: tenant.id,
      name: body.name,
      slug: body.slug,
    });

    return toClubResponse(club);
  }

  @Patch("current/name")
  @ApiOperation({ summary: "Rename the current tenant core club" })
  @ApiBody({ type: RenameClubRequestDto })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Core club renamed.",
    data: ClubResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    { status: HttpStatus.BAD_REQUEST, description: "Validation failed or domain rule failed." },
    { status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid session." },
    { status: HttpStatus.FORBIDDEN, description: "Tenant admin role is required." },
    { status: HttpStatus.NOT_FOUND, description: "Core club was not found." },
  )
  public async renameCurrent(@Body() body: RenameClubRequestDto) {
    const tenant = this.context.getTenantOrThrow();
    const club = await this.renameClub.execute({ clubId: tenant.id, name: body.name });

    return toClubResponse(club);
  }

  @Patch("current/slug")
  @ApiOperation({ summary: "Change the current tenant core club slug" })
  @ApiBody({ type: ChangeClubSlugRequestDto })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Core club slug changed.",
    data: ClubResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    { status: HttpStatus.BAD_REQUEST, description: "Validation failed or domain rule failed." },
    { status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid session." },
    { status: HttpStatus.FORBIDDEN, description: "Tenant admin role is required." },
    { status: HttpStatus.NOT_FOUND, description: "Core club was not found." },
    { status: HttpStatus.CONFLICT, description: "Club slug already exists." },
  )
  public async changeCurrentSlug(@Body() body: ChangeClubSlugRequestDto) {
    const tenant = this.context.getTenantOrThrow();
    const club = await this.changeClubSlug.execute({ clubId: tenant.id, slug: body.slug });

    return toClubResponse(club);
  }

  @Post("current/activate")
  @ApiOperation({ summary: "Activate the current tenant core club" })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.CREATED,
    description: "Core club activated.",
    data: ClubResponseDto,
  })
  public async activateCurrent() {
    const tenant = this.context.getTenantOrThrow();
    const club = await this.activateClub.execute({ clubId: tenant.id });

    return toClubResponse(club);
  }

  @Post("current/deactivate")
  @ApiOperation({ summary: "Deactivate the current tenant core club" })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.CREATED,
    description: "Core club deactivated.",
    data: ClubResponseDto,
  })
  public async deactivateCurrent() {
    const tenant = this.context.getTenantOrThrow();
    const club = await this.deactivateClub.execute({ clubId: tenant.id });

    return toClubResponse(club);
  }
}
