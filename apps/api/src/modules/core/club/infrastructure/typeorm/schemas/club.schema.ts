import { EntitySchema, type EntitySchemaOptions } from "typeorm";
import { Club } from "../../../domain/club";
import { ClubId } from "../../../domain/value-objects/club-id";
import { ClubName } from "../../../domain/value-objects/club-name";
import { ClubSlug } from "../../../domain/value-objects/club-slug";
import { domainIdTransformer } from "../../../../infrastructure/typeorm/domain-transformers";

export type ClubPersistence = {
  id: ClubId;
  nameValue: ClubName;
  slugValue: ClubSlug;
  activeValue: boolean;
  createdAt: Date;
};

const clubSchemaOptions: EntitySchemaOptions<ClubPersistence> = {
  target: Club,
  name: "Club",
  tableName: "clubs",
  columns: {
    id: {
      type: "varchar",
      primary: true,
      length: 80,
      transformer: domainIdTransformer(ClubId),
    },
    nameValue: {
      name: "name",
      type: "varchar",
      length: 160,
      transformer: {
        to: (name: ClubName) => name.value,
        from: (value: string) => ClubName.from(value),
      },
    },
    slugValue: {
      name: "slug",
      type: "varchar",
      length: 120,
      unique: true,
      transformer: {
        to: (slug: ClubSlug) => slug.value,
        from: (value: string) => ClubSlug.from(value),
      },
    },
    activeValue: {
      name: "active",
      type: "boolean",
      default: true,
    },
    createdAt: {
      name: "created_at",
      type: "timestamptz",
    },
  },
};

export const ClubSchema = new EntitySchema<ClubPersistence>(clubSchemaOptions);
