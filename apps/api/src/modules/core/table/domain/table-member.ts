import { AthleteId } from "../../athlete/domain";

type TableMemberInput = {
  athleteId: AthleteId;
  joinedAt: Date;
};

export type TableMemberData = {
  athleteId: string | AthleteId;
  joinedAt: string | Date;
};

export class TableMember {
  public readonly athleteId: AthleteId;
  public readonly joinedAt: Date;

  private constructor(input: TableMemberInput) {
    this.athleteId = input.athleteId;
    this.joinedAt = input.joinedAt;
  }

  public static create(input: TableMemberInput): TableMember {
    return new TableMember(input);
  }

  public static from(input: TableMember | TableMemberData): TableMember {
    return input instanceof TableMember
      ? input
      : TableMember.create({
          athleteId: AthleteId.from(input.athleteId),
          joinedAt: input.joinedAt instanceof Date ? input.joinedAt : new Date(input.joinedAt),
        });
  }

  public belongsTo(athleteId: AthleteId): boolean {
    return this.athleteId.equals(athleteId);
  }
}
