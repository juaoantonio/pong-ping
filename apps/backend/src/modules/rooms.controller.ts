import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser, type RequestUser } from "../auth/current-user";
import { RequireRole, RolesGuard } from "../auth/roles.guard";
import {
  AddParticipantDto,
  CreateInvitationDto,
  CreateRoomDto,
  FinishMatchDto,
} from "../dtos";
import { RoomsService } from "../services/rooms.service";

@Controller()
@UseGuards(AuthGuard)
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Get("rooms")
  list() {
    return this.rooms.list();
  }

  @Get("rooms/user-options")
  @UseGuards(RolesGuard)
  @RequireRole("admin")
  async globalUserOptions() {
    return { users: await this.rooms.userOptions() };
  }

  @Get("rooms/:roomId")
  async detail(@Param("roomId") roomId: string) {
    return { room: await this.rooms.detail(roomId) };
  }

  @Get("rooms/:roomId/user-options")
  @UseGuards(RolesGuard)
  @RequireRole("admin")
  async userOptions() {
    return { users: await this.rooms.userOptions() };
  }

  @Get("room-invitations/:token")
  invitationPreview(@Param("token") token: string) {
    return this.rooms.invitationPreview(token);
  }

  @Post("rooms/join/:token")
  join(@Param("token") token: string, @CurrentUser() user: RequestUser) {
    return this.rooms.joinByInvitation(token, user.id);
  }

  @Post("admin/rooms")
  @UseGuards(RolesGuard)
  @RequireRole("admin")
  create(@Body() body: CreateRoomDto, @CurrentUser() user: RequestUser) {
    return this.rooms.createRoom(body.name, user.id);
  }

  @Delete("admin/rooms/:roomId")
  @UseGuards(RolesGuard)
  @RequireRole("admin")
  delete(@Param("roomId") roomId: string, @CurrentUser() user: RequestUser) {
    return this.rooms.deleteRoom(roomId, user.id);
  }

  @Post("admin/rooms/:roomId/invites")
  @UseGuards(RolesGuard)
  @RequireRole("admin")
  createInvite(
    @Param("roomId") roomId: string,
    @Body() body: CreateInvitationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.rooms.createRoomInvitation(roomId, user.id, body);
  }

  @Post("admin/rooms/:roomId/participants")
  @UseGuards(RolesGuard)
  @RequireRole("admin")
  addParticipant(
    @Param("roomId") roomId: string,
    @Body() body: AddParticipantDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.rooms.addParticipant(roomId, body.userId, user.id);
  }

  @Delete("admin/rooms/:roomId/participants/:participantId")
  @UseGuards(RolesGuard)
  @RequireRole("admin")
  removeParticipant(
    @Param("roomId") roomId: string,
    @Param("participantId") participantId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.rooms.removeParticipant(roomId, participantId, user.id);
  }

  @Post("admin/rooms/:roomId/matches")
  @UseGuards(RolesGuard)
  @RequireRole("admin")
  finishMatch(
    @Param("roomId") roomId: string,
    @Body() body: FinishMatchDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.rooms.finishMatch(roomId, body.winnerParticipantId, user.id);
  }

  @Post("admin/rooms/:roomId/matches/:matchId/rollback")
  @UseGuards(RolesGuard)
  @RequireRole("admin")
  rollback(
    @Param("roomId") roomId: string,
    @Param("matchId") matchId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.rooms.rollback(roomId, matchId, user.id);
  }
}
