import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MatchHistory } from "../entities";

export type RoundFilters = {
  q?: string;
  roomId?: string;
  player?: string;
  createdBy?: string;
  kind?: string;
  status?: string;
  from?: string;
  to?: string;
};

@Injectable()
export class AdminRoundsService {
  constructor(@InjectRepository(MatchHistory) private readonly matches: Repository<MatchHistory>) {}

  async list(filters: RoundFilters) {
    const qb = this.matches
      .createQueryBuilder("round")
      .leftJoinAndSelect("round.room", "room")
      .leftJoinAndSelect("round.winner", "winner")
      .leftJoinAndSelect("round.loser", "loser")
      .leftJoinAndSelect("round.createdBy", "createdBy")
      .leftJoinAndSelect("round.rollbacks", "rollbacks")
      .orderBy("round.createdAt", "DESC")
      .take(200);

    const like = (value: string) => `%${value}%`;

    if (filters.q?.trim()) {
      const q = like(filters.q.trim());
      qb.andWhere(
        `(round.id ILIKE :q OR round.roomId ILIKE :q OR round.rollbackOfId ILIKE :q OR room.name ILIKE :q OR winner.name ILIKE :q OR winner.email ILIKE :q OR loser.name ILIKE :q OR loser.email ILIKE :q OR createdBy.name ILIKE :q OR createdBy.email ILIKE :q)`,
        { q },
      );
    }
    if (filters.roomId?.trim()) {
      qb.andWhere("round.roomId ILIKE :roomId", { roomId: like(filters.roomId.trim()) });
    }
    if (filters.kind === "match" || filters.kind === "rollback") {
      qb.andWhere("round.kind = :kind", { kind: filters.kind });
    }
    if (filters.status === "rolled_back") {
      qb.andWhere("round.kind = 'match' AND rollbacks.id IS NOT NULL");
    }
    if (filters.status === "rollback_available") {
      qb.andWhere("round.kind = 'match' AND rollbacks.id IS NULL");
    }
    if (filters.status === "rollback_record") {
      qb.andWhere("round.kind = 'rollback'");
    }
    if (filters.player?.trim()) {
      const player = like(filters.player.trim());
      qb.andWhere("(winner.name ILIKE :player OR winner.email ILIKE :player OR loser.name ILIKE :player OR loser.email ILIKE :player)", {
        player,
      });
    }
    if (filters.createdBy?.trim()) {
      const createdBy = like(filters.createdBy.trim());
      qb.andWhere("(createdBy.name ILIKE :createdBy OR createdBy.email ILIKE :createdBy)", { createdBy });
    }

    const from = this.dateFromInput(filters.from);
    const to = this.dateFromInput(filters.to, true);
    if (from) {
      qb.andWhere("round.createdAt >= :from", { from });
    }
    if (to) {
      qb.andWhere("round.createdAt <= :to", { to });
    }

    const rounds = await qb.getMany();
    return {
      rounds: rounds.map((round) => ({
        id: round.id,
        roomId: round.roomId,
        rollbackOfId: round.rollbackOfId,
        rolledBack: round.rollbacks.length > 0,
        kind: round.kind,
        winnerOldElo: round.winnerOldElo,
        winnerNewElo: round.winnerNewElo,
        winnerDiffPoints: round.winnerDiffPoints,
        loserOldElo: round.loserOldElo,
        loserNewElo: round.loserNewElo,
        loserDiffPoints: round.loserDiffPoints,
        createdAt: round.createdAt.toISOString(),
        roomName: round.room?.name ?? null,
        winner: { name: round.winner.name, email: round.winner.email },
        loser: { name: round.loser.name, email: round.loser.email },
        createdBy: { name: round.createdBy.name, email: round.createdBy.email },
      })),
    };
  }

  private dateFromInput(value: string | undefined, endOfDay = false) {
    if (!value) {
      return undefined;
    }

    const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
}
