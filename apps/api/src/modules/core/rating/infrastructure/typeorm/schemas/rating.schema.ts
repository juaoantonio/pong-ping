import { EntitySchema, type EntitySchemaOptions } from "typeorm";
import { AthleteId } from "../../../../athlete/domain";
import { ClubId } from "../../../../club/domain";
import { domainIdTransformer } from "../../../../infrastructure/typeorm/domain-transformers";
import { Rating } from "../../../domain/rating";
import { RatingPoints } from "../../../domain/value-objects/rating-points";

export type RatingPersistence = {
  id: AthleteId;
  clubId: ClubId;
  pointsValue: RatingPoints;
  winsValue: number;
  totalMatchesValue: number;
};

const ratingSchemaOptions: EntitySchemaOptions<RatingPersistence> = {
  target: Rating,
  name: "Rating",
  tableName: "ratings",
  columns: {
    id: {
      name: "athlete_id",
      type: "varchar",
      primary: true,
      length: 80,
      transformer: domainIdTransformer(AthleteId),
    },
    clubId: {
      name: "club_id",
      type: "varchar",
      length: 80,
      transformer: domainIdTransformer(ClubId),
    },
    pointsValue: {
      name: "points",
      type: "int",
      transformer: {
        to: (points: RatingPoints) => points.value,
        from: (value: number) => RatingPoints.from(value),
      },
    },
    winsValue: {
      name: "wins",
      type: "int",
    },
    totalMatchesValue: {
      name: "total_matches",
      type: "int",
    },
  },
  indices: [{ name: "IDX_ratings_club_id", columns: ["clubId"] }],
};

export const RatingSchema = new EntitySchema<RatingPersistence>(ratingSchemaOptions);
