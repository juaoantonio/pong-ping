import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser, type RequestUser } from "../auth/current-user";
import { RequireRole, RolesGuard } from "../auth/roles.guard";
import { AdminRoundsService, type RoundFilters } from "../services/admin-rounds.service";
import { RoomsService } from "../services/rooms.service";
import { notFound, conflict } from "../shared/http-error";
import { InjectRepository } from "@nestjs/typeorm";
import { MatchHistory } from "../entities";
import { Repository } from "typeorm";

@Controller("admin/rounds")
@UseGuards(AuthGuard, RolesGuard)
@RequireRole("superadmin")
export class AdminRoundsController {
  constructor(
    private readonly rounds: AdminRoundsService,
    private readonly rooms: RoomsService,
    @InjectRepository(MatchHistory) private readonly matches: Repository<MatchHistory>,
  ) {}

  @Get()
  list(@Query() filters: RoundFilters) {
    return this.rounds.list(filters);
  }

  @Post(":roundId/rollback")
  async rollback(@Param("roundId") roundId: string, @CurrentUser() user: RequestUser) {
    const round = await this.matches.findOne({ where: { id: roundId } });
    if (!round) {
      throw notFound("Rodada nao encontrada.", "match_not_found");
    }
    if (!round.roomId) {
      throw conflict("Rodada sem room id nao pode ser revertida por esta tela.");
    }
    return this.rooms.rollback(round.roomId, roundId, user.id);
  }
}
