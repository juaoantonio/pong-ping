import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser, type RequestUser } from "../auth/current-user";
import { RequireRole, RolesGuard } from "../auth/roles.guard";
import { AllowEmailDto, ClaimInvitationDto, CreateInvitationDto, LegacyAccessDto } from "../dtos";
import { AccessService } from "../services/access.service";
import { badRequest } from "../shared/http-error";

@Controller()
export class AccessController {
  constructor(private readonly access: AccessService) {}

  @Get("admin/access")
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole("admin")
  list() {
    return this.access.list();
  }

  @Post("admin/access")
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole("admin")
  legacyCreate(@CurrentUser() user: RequestUser, @Body() body: LegacyAccessDto) {
    if (body.type === "invite") {
      return this.access.createInvitation(body, user.id);
    }
    if (!body.email) {
      throw badRequest("Informe um email valido.");
    }
    return this.access.allowEmail(body.email, user.id);
  }

  @Post("admin/access/allowed-emails")
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole("admin")
  allowEmail(@CurrentUser() user: RequestUser, @Body() body: AllowEmailDto) {
    return this.access.allowEmail(body.email, user.id);
  }

  @Post("admin/access/invitations")
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole("admin")
  createInvitation(@CurrentUser() user: RequestUser, @Body() body: CreateInvitationDto) {
    return this.access.createInvitation(body, user.id);
  }

  @Post("invitations/:token/claim")
  claim(@Param("token") token: string, @Body() body: ClaimInvitationDto) {
    return this.access.claim(token, body.email);
  }

  @Post("invitations/:token")
  legacyClaim(@Param("token") token: string, @Body() body: ClaimInvitationDto) {
    return this.access.claim(token, body.email);
  }
}
