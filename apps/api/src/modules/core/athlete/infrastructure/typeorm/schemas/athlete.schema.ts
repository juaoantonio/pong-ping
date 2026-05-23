import { EntitySchema, type EntitySchemaOptions } from "typeorm";
import { ClubId } from "../../../../club/domain";
import { ActorId } from "../../../../shared/domain";
import {
  athleteProfileTransformer,
  domainIdTransformer,
} from "../../../../infrastructure/typeorm/domain-transformers";
import { Athlete } from "../../../domain/athlete";
import { AthleteDisplayName } from "../../../domain/value-objects/athlete-display-name";
import { AthleteId } from "../../../domain/value-objects/athlete-id";
import { type AthleteProfile } from "../../../domain/value-objects/athlete-profile";

export type AthletePersistence = {
  id: AthleteId;
  clubId: ClubId;
  userId: ActorId;
  displayNameValue: AthleteDisplayName;
  profileValue: AthleteProfile;
};

const athleteSchemaOptions: EntitySchemaOptions<AthletePersistence> = {
  target: Athlete,
  name: "Athlete",
  tableName: "athletes",
  columns: {
    id: {
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
    userId: {
      name: "user_id",
      type: "varchar",
      length: 120,
      transformer: domainIdTransformer(ActorId),
    },
    displayNameValue: {
      name: "display_name",
      type: "varchar",
      length: 80,
      transformer: {
        to: (displayName: AthleteDisplayName) => displayName.value,
        from: (value: string) => AthleteDisplayName.from(value),
      },
    },
    profileValue: {
      name: "profile",
      type: "jsonb",
      transformer: athleteProfileTransformer,
    },
  },
  indices: [
    { name: "IDX_athletes_club_id", columns: ["clubId"] },
    {
      name: "UQ_athletes_club_id_user_id",
      columns: ["clubId", "userId"],
      unique: true,
    },
  ],
};

export const AthleteSchema = new EntitySchema<AthletePersistence>(athleteSchemaOptions);
