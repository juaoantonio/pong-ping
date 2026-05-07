import { type AthleteId } from "../../athlete/domain";

type TableMemberInput = {
  athleteId: AthleteId;
  joinedAt: Date;
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

  public belongsTo(athleteId: AthleteId): boolean {
    return this.athleteId.equals(athleteId);
  }
}
