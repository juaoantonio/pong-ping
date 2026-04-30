import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RankLevel, User } from "../entities";
import { DEFAULT_PLAYER_ELO } from "../domain/rules";

@Injectable()
export class RankingsService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RankLevel)
    private readonly rankLevels: Repository<RankLevel>,
  ) {}

  async list() {
    const [users, rankLevels] = await Promise.all([
      this.users.find({ relations: { playerRanking: true } }),
      this.rankLevels.find({ order: { minElo: "DESC" } }),
    ]);

    return users
      .map((user) => {
        const ranking = user.playerRanking ?? {
          elo: DEFAULT_PLAYER_ELO,
          wins: 0,
          total_matches: 0,
          winRate: 0,
        };
        const rankLevel =
          rankLevels.find((level) => ranking.elo >= level.minElo) ?? null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          ranking,
          rankLevel: rankLevel
            ? {
                name: rankLevel.name,
                minElo: rankLevel.minElo,
                iconImgKey: rankLevel.iconImgKey,
              }
            : null,
        };
      })
      .sort((first, second) => {
        if (second.ranking.elo !== first.ranking.elo) {
          return second.ranking.elo - first.ranking.elo;
        }
        if (second.ranking.wins !== first.ranking.wins) {
          return second.ranking.wins - first.ranking.wins;
        }
        return (first.name ?? first.email ?? "").localeCompare(
          second.name ?? second.email ?? "",
        );
      });
  }
}
