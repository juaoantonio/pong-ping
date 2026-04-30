import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, MoreThan, Repository } from "typeorm";
import {
  AuditLog,
  MatchHistory,
  PingPongRoom,
  PingPongRoomInvitation,
  PingPongRoomParticipant,
  PlayerRanking,
  User,
} from "../entities";
import {
  calculateElo,
  calculateWinRate,
  createId,
  createRoomInvitationToken,
  DEFAULT_PLAYER_ELO,
  getInvitationExpiry,
  isInvitationExpiryPreset,
  MATCH_ELO_K,
  rotateQueueAfterMatch,
} from "../domain/rules";
import { badRequest, conflict, notFound } from "../shared/http-error";

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(PingPongRoom) private readonly rooms: Repository<PingPongRoom>,
    @InjectRepository(PingPongRoomParticipant) private readonly participants: Repository<PingPongRoomParticipant>,
    @InjectRepository(PingPongRoomInvitation) private readonly invitations: Repository<PingPongRoomInvitation>,
    @InjectRepository(MatchHistory) private readonly matches: Repository<MatchHistory>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async list() {
    const rooms = await this.rooms.find({
      where: { deletedAt: IsNull() },
      relations: { createdBy: true },
      order: { createdAt: "DESC" },
    });

    return Promise.all(
      rooms.map(async (room) => {
        const [participants, latestMatch] = await Promise.all([
          this.participants.find({
            where: { roomId: room.id },
            relations: { user: true },
            order: { queuePosition: "ASC" },
          }),
          this.latestMatch(room.id),
        ]);

        return {
          id: room.id,
          name: room.name,
          createdAt: room.createdAt.toISOString(),
          createdBy: this.userIdentity(room.createdBy),
          participantCount: participants.length,
          currentPlayers: participants.slice(0, 2).map((participant) => this.userIdentity(participant.user)),
          latestMatch,
        };
      }),
    );
  }

  async detail(roomId: string) {
    const room = await this.rooms.findOne({
      where: { id: roomId, deletedAt: IsNull() },
      relations: { createdBy: true },
    });
    if (!room) {
      throw notFound("Sala nao encontrada.", "room_not_found");
    }

    const [participants, invitation, recentMatches] = await Promise.all([
      this.participants.find({
        where: { roomId },
        relations: { user: { playerRanking: true } },
        order: { queuePosition: "ASC" },
      }),
      this.invitations.findOne({
        where: [{ roomId, expiresAt: MoreThan(new Date()), oneTimeUse: false }, { roomId, expiresAt: MoreThan(new Date()), usedAt: IsNull() }],
        order: { createdAt: "DESC" },
      }),
      this.recentMatches(roomId),
    ]);

    return {
      id: room.id,
      name: room.name,
      createdAt: room.createdAt.toISOString(),
      createdBy: { name: room.createdBy.name, email: room.createdBy.email },
      currentInvitation: invitation
        ? {
            id: invitation.id,
            token: invitation.token,
            expiresAt: invitation.expiresAt.toISOString(),
            oneTimeUse: invitation.oneTimeUse,
          }
        : null,
      participants: participants.map((participant) => ({
        id: participant.id,
        queuePosition: participant.queuePosition,
        joinedAt: participant.joinedAt.toISOString(),
        user: {
          id: participant.user.id,
          name: participant.user.name,
          email: participant.user.email,
          avatarUrl: participant.user.avatarUrl ?? participant.user.image,
          playerRanking: participant.user.playerRanking,
        },
      })),
      recentMatches,
    };
  }

  async userOptions() {
    const users = await this.users.find({ order: { name: "ASC", email: "ASC" } });
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? user.image,
    }));
  }

  async invitationPreview(token: string) {
    const invitation = await this.invitations.findOne({
      where: { token },
      relations: { room: { createdBy: true } },
    });

    if (!invitation || invitation.expiresAt < new Date() || (invitation.oneTimeUse && invitation.usedAt)) {
      throw notFound("Convite de sala invalido.", "room_invitation_not_found");
    }

    return {
      room: {
        id: invitation.room.id,
        name: invitation.room.name,
        createdBy: {
          name: invitation.room.createdBy.name,
          email: invitation.room.createdBy.email,
        },
      },
      expiresAt: invitation.expiresAt.toISOString(),
      oneTimeUse: invitation.oneTimeUse,
    };
  }

  async createRoom(name: string, actorUserId: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw badRequest("Informe o nome da sala.");
    }

    const room = await this.rooms.manager.transaction(async (manager) => {
      const createdRoom = await manager.save(
        PingPongRoom,
        manager.create(PingPongRoom, {
          id: createId(),
          name: trimmedName,
          createdById: actorUserId,
        }),
      );
      await this.audit(manager, actorUserId, "room_created", {
        roomId: createdRoom.id,
        roomName: createdRoom.name,
      });
      return createdRoom;
    });

    return { room: { id: room.id, name: room.name } };
  }

  async deleteRoom(roomId: string, actorUserId: string) {
    const result = await this.rooms.update({ id: roomId }, { deletedAt: new Date() });
    if (!result.affected) {
      throw notFound("Sala nao encontrada.", "room_not_found");
    }
    await this.audit(this.rooms.manager, actorUserId, "room_deleted", { roomId });
    return { message: "Sala deletada com sucesso." };
  }

  async createRoomInvitation(roomId: string, actorUserId: string, input: { expiresIn?: unknown; oneTimeUse?: boolean }) {
    const room = await this.rooms.findOneBy({ id: roomId });
    if (!room) {
      throw notFound("Sala nao encontrada.", "room_not_found");
    }

    const expiresIn = input.expiresIn ?? "7d";
    if (!isInvitationExpiryPreset(expiresIn)) {
      throw badRequest("Informe uma validade valida para o convite.");
    }

    const token = createRoomInvitationToken();
    const invite = await this.invitations.manager.transaction(async (manager) => {
      const createdInvite = await manager.save(
        PingPongRoomInvitation,
        manager.create(PingPongRoomInvitation, {
          id: createId(),
          roomId,
          token,
          createdById: actorUserId,
          expiresAt: getInvitationExpiry(expiresIn),
          oneTimeUse: typeof input.oneTimeUse === "boolean" ? input.oneTimeUse : false,
        }),
      );
      await this.audit(manager, actorUserId, "room_invitation_created", {
        roomId,
        invitationId: createdInvite.id,
        expiresAt: createdInvite.expiresAt.toISOString(),
        oneTimeUse: createdInvite.oneTimeUse,
      });
      return createdInvite;
    });

    return {
      invite: {
        id: invite.id,
        expiresAt: invite.expiresAt.toISOString(),
        oneTimeUse: invite.oneTimeUse,
        token,
      },
    };
  }

  async addParticipant(roomId: string, userId: string, actorUserId?: string) {
    await this.participants.manager.transaction(async (manager) => {
      await this.addUserToRoom(manager, roomId, userId);
      if (actorUserId) {
        await this.audit(manager, actorUserId, "room_participant_added", { roomId }, userId);
      }
    });

    return { ok: true };
  }

  async removeParticipant(roomId: string, participantId: string, actorUserId: string) {
    await this.participants.manager.transaction(async (manager) => {
      const participant = await manager.findOne(PingPongRoomParticipant, { where: { id: participantId } });
      await this.removeParticipantFromRoom(manager, roomId, participantId);
      await this.audit(manager, actorUserId, "room_participant_removed", { roomId, participantId }, participant?.userId);
    });

    return { ok: true };
  }

  async joinByInvitation(token: string, actorUserId: string) {
    const invitation = await this.invitations.findOne({ where: { token } });
    if (!invitation) {
      throw notFound("Convite de sala invalido.", "room_invitation_not_found");
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      throw badRequest("Este convite de sala expirou.");
    }
    if (invitation.oneTimeUse && invitation.usedAt) {
      throw badRequest("Este convite de sala ja foi utilizado.");
    }

    await this.invitations.manager.transaction(async (manager) => {
      await this.addUserToRoom(manager, invitation.roomId, actorUserId);
      const usedAt = new Date();
      const current = await manager.findOneByOrFail(PingPongRoomInvitation, { id: invitation.id });
      if (current.expiresAt <= usedAt || (current.oneTimeUse && current.usedAt)) {
        throw badRequest("Convite de sala invalido, expirado ou ja utilizado.");
      }
      current.usedAt = usedAt;
      current.usedByUserId = actorUserId;
      await manager.save(PingPongRoomInvitation, current);
      await this.audit(manager, actorUserId, "room_joined_via_invitation", {
        roomId: invitation.roomId,
        invitationId: invitation.id,
        oneTimeUse: invitation.oneTimeUse,
      });
    });

    return { ok: true };
  }

  async finishMatch(roomId: string, winnerParticipantId: string, actorUserId: string) {
    const match = await this.matches.manager.transaction((manager) =>
      this.finishRoomMatch(manager, roomId, winnerParticipantId, actorUserId),
    );
    return { match };
  }

  async rollback(roomId: string, matchId: string, actorUserId: string) {
    const rollback = await this.matches.manager.transaction((manager) =>
      this.rollbackRoomMatch(manager, roomId, matchId, actorUserId),
    );
    return { rollback };
  }

  private async latestMatch(roomId: string) {
    const match = await this.matches.findOne({
      where: { roomId },
      relations: { winner: true, loser: true, rollbacks: true },
      order: { createdAt: "DESC" },
    });
    return match ? this.matchDto(match) : null;
  }

  private async recentMatches(roomId: string) {
    const matches = await this.matches.find({
      where: { roomId },
      relations: { winner: true, loser: true, rollbacks: true },
      order: { createdAt: "DESC" },
      take: 10,
    });
    return matches.map((match) => this.matchDto(match));
  }

  private matchDto(match: MatchHistory) {
    return {
      id: match.id,
      kind: match.kind,
      rollbackOfId: match.rollbackOfId,
      rolledBack: match.rollbacks?.length > 0,
      createdAt: match.createdAt.toISOString(),
      winnerOldElo: match.winnerOldElo,
      winnerNewElo: match.winnerNewElo,
      winnerDiffPoints: match.winnerDiffPoints,
      loserOldElo: match.loserOldElo,
      loserNewElo: match.loserNewElo,
      loserDiffPoints: match.loserDiffPoints,
      winner: this.userIdentity(match.winner),
      loser: this.userIdentity(match.loser),
    };
  }

  private userIdentity(user: User) {
    return {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? user.image,
    };
  }

  private async addUserToRoom(manager: any, roomId: string, userId: string) {
    const [room, user, existingParticipant] = await Promise.all([
      manager.findOne(PingPongRoom, { where: { id: roomId } }),
      manager.findOne(User, { where: { id: userId } }),
      manager.findOne(PingPongRoomParticipant, { where: { roomId, userId } }),
    ]);

    if (!room) {
      throw notFound("Sala nao encontrada.", "room_not_found");
    }
    if (!user) {
      throw badRequest("Usuario nao encontrado.", "user_not_found");
    }
    if (existingParticipant) {
      throw badRequest("Este usuario ja esta na sala.", "user_already_joined");
    }

    const lastParticipant = await manager.findOne(PingPongRoomParticipant, {
      where: { roomId },
      order: { queuePosition: "DESC" },
    });

    return manager.save(
      PingPongRoomParticipant,
      manager.create(PingPongRoomParticipant, {
        id: createId(),
        roomId,
        userId,
        queuePosition: (lastParticipant?.queuePosition ?? -1) + 1,
      }),
    );
  }

  private async removeParticipantFromRoom(manager: any, roomId: string, participantId: string) {
    const participants = await manager.find(PingPongRoomParticipant, {
      where: { roomId },
      order: { queuePosition: "ASC" },
    });
    const nextQueue = participants.filter((participant: PingPongRoomParticipant) => participant.id !== participantId);
    if (nextQueue.length === participants.length) {
      throw notFound("Participante nao encontrado.", "participant_not_found");
    }

    await manager.delete(PingPongRoomParticipant, { id: participantId });
    await this.reorderRoomQueue(manager, nextQueue.map((participant: PingPongRoomParticipant) => participant.id));
  }

  private async finishRoomMatch(manager: any, roomId: string, winnerParticipantId: string, actorUserId: string) {
    const room = await manager.findOne(PingPongRoom, { where: { id: roomId } });
    if (!room) {
      throw notFound("Sala nao encontrada.", "room_not_found");
    }

    const queue = await manager.find(PingPongRoomParticipant, {
      where: { roomId },
      order: { queuePosition: "ASC" },
    });
    if (queue.length < 2) {
      throw badRequest("A fila precisa de pelo menos dois jogadores.", "not_enough_players");
    }

    let reorderedQueueIds: string[];
    try {
      reorderedQueueIds = rotateQueueAfterMatch(
        queue.map((participant: PingPongRoomParticipant) => participant.id),
        winnerParticipantId,
      );
    } catch (error) {
      if (error instanceof Error && error.message === "winner_not_in_current_match") {
        throw badRequest("O vencedor precisa estar na mesa atual.", "winner_not_in_current_match");
      }
      throw error;
    }

    const currentPlayers = queue.slice(0, 2);
    const winnerParticipant = currentPlayers.find((participant: PingPongRoomParticipant) => participant.id === winnerParticipantId);
    const loserParticipant = currentPlayers.find((participant: PingPongRoomParticipant) => participant.id !== winnerParticipantId);
    if (!winnerParticipant || !loserParticipant) {
      throw badRequest("O vencedor precisa estar na mesa atual.", "winner_not_in_current_match");
    }

    const winnerRanking = await this.upsertRanking(manager, winnerParticipant.userId);
    const loserRanking = await this.upsertRanking(manager, loserParticipant.userId);
    const nextElo = calculateElo(winnerRanking.elo, loserRanking.elo, MATCH_ELO_K);
    const winnerWins = winnerRanking.wins + 1;
    const winnerTotalMatches = winnerRanking.total_matches + 1;
    const loserTotalMatches = loserRanking.total_matches + 1;
    const winnerDiffPoints = nextElo.winnerElo - winnerRanking.elo;
    const loserDiffPoints = nextElo.loserElo - loserRanking.elo;

    const createdMatch = await manager.save(
      MatchHistory,
      manager.create(MatchHistory, {
        id: createId(),
        roomId,
        winnerId: winnerParticipant.userId,
        loserId: loserParticipant.userId,
        kind: "match",
        createdById: actorUserId,
        kFactor: MATCH_ELO_K,
        winnerOldElo: winnerRanking.elo,
        winnerNewElo: nextElo.winnerElo,
        winnerDiffPoints,
        loserOldElo: loserRanking.elo,
        loserNewElo: nextElo.loserElo,
        loserDiffPoints,
      }),
    );

    await manager.update(PlayerRanking, { userId: winnerParticipant.userId }, {
      elo: nextElo.winnerElo,
      wins: winnerWins,
      total_matches: winnerTotalMatches,
      winRate: calculateWinRate(winnerWins, winnerTotalMatches),
    });
    await manager.update(PlayerRanking, { userId: loserParticipant.userId }, {
      elo: nextElo.loserElo,
      total_matches: loserTotalMatches,
      winRate: calculateWinRate(loserRanking.wins, loserTotalMatches),
    });
    await this.audit(manager, actorUserId, "room_match_finished", {
      roomId,
      winnerId: winnerParticipant.userId,
      loserId: loserParticipant.userId,
      kFactor: MATCH_ELO_K,
    });
    await this.reorderRoomQueue(manager, reorderedQueueIds);

    return {
      id: createdMatch.id,
      winnerId: createdMatch.winnerId,
      loserId: createdMatch.loserId,
      winnerNewElo: createdMatch.winnerNewElo,
      loserNewElo: createdMatch.loserNewElo,
    };
  }

  private async rollbackRoomMatch(manager: any, roomId: string, matchHistoryId: string, actorUserId: string) {
    const match = await manager.findOne(MatchHistory, {
      where: { id: matchHistoryId, roomId },
      relations: { rollbacks: true },
    });
    if (!match) {
      throw notFound("Rodada nao encontrada.", "match_not_found");
    }
    if (match.kind === "rollback") {
      throw badRequest("Um rollback nao pode ser revertido.", "cannot_rollback_rollback");
    }
    if (match.rollbacks.length > 0) {
      throw conflict("Esta rodada ja foi revertida.", "match_already_rolled_back");
    }

    const [winnerRanking, loserRanking] = await Promise.all([
      manager.findOne(PlayerRanking, { where: { userId: match.winnerId } }),
      manager.findOne(PlayerRanking, { where: { userId: match.loserId } }),
    ]);
    if (!winnerRanking || !loserRanking) {
      throw conflict("Ranking da rodada nao encontrado.", "ranking_not_found");
    }

    const nextWinnerElo = winnerRanking.elo - match.winnerDiffPoints;
    const nextLoserElo = loserRanking.elo - match.loserDiffPoints;
    const nextWinnerWins = Math.max(0, winnerRanking.wins - 1);
    const nextWinnerTotalMatches = Math.max(0, winnerRanking.total_matches - 1);
    const nextLoserTotalMatches = Math.max(0, loserRanking.total_matches - 1);

    const rollback = await manager.save(
      MatchHistory,
      manager.create(MatchHistory, {
        id: createId(),
        roomId,
        winnerId: match.winnerId,
        loserId: match.loserId,
        kind: "rollback",
        rollbackOfId: match.id,
        createdById: actorUserId,
        kFactor: match.kFactor,
        winnerOldElo: winnerRanking.elo,
        winnerNewElo: nextWinnerElo,
        winnerDiffPoints: -match.winnerDiffPoints,
        loserOldElo: loserRanking.elo,
        loserNewElo: nextLoserElo,
        loserDiffPoints: -match.loserDiffPoints,
      }),
    );

    await manager.update(PlayerRanking, { userId: match.winnerId }, {
      elo: nextWinnerElo,
      wins: nextWinnerWins,
      total_matches: nextWinnerTotalMatches,
      winRate: calculateWinRate(nextWinnerWins, nextWinnerTotalMatches),
    });
    await manager.update(PlayerRanking, { userId: match.loserId }, {
      elo: nextLoserElo,
      total_matches: nextLoserTotalMatches,
      winRate: calculateWinRate(loserRanking.wins, nextLoserTotalMatches),
    });
    await this.audit(manager, actorUserId, "room_match_rolled_back", {
      roomId,
      matchHistoryId,
      winnerId: match.winnerId,
      loserId: match.loserId,
    });

    return {
      id: rollback.id,
      rollbackOfId: rollback.rollbackOfId,
      winnerId: rollback.winnerId,
      loserId: rollback.loserId,
      winnerNewElo: rollback.winnerNewElo,
      loserNewElo: rollback.loserNewElo,
    };
  }

  private async reorderRoomQueue(manager: any, participantIds: string[]) {
    const temporaryOffset = participantIds.length + 1000;
    await Promise.all(
      participantIds.map((participantId, index) =>
        manager.update(PingPongRoomParticipant, { id: participantId }, { queuePosition: temporaryOffset + index }),
      ),
    );
    await Promise.all(
      participantIds.map((participantId, index) =>
        manager.update(PingPongRoomParticipant, { id: participantId }, { queuePosition: index }),
      ),
    );
  }

  private async upsertRanking(manager: any, userId: string) {
    let ranking = await manager.findOne(PlayerRanking, { where: { userId } });
    if (!ranking) {
      ranking = await manager.save(
        PlayerRanking,
        manager.create(PlayerRanking, {
          id: createId(),
          userId,
          elo: DEFAULT_PLAYER_ELO,
        }),
      );
    }
    return ranking;
  }

  private async audit(manager: any, actorUserId: string | null, action: string, metadata: unknown, targetUserId?: string | null) {
    await manager.save(
      AuditLog,
      manager.create(AuditLog, {
        id: createId(),
        actorUserId,
        targetUserId,
        action,
        metadata,
      }),
    );
  }
}
