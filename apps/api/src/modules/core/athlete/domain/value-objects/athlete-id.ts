import { DomainId } from "../../../shared/domain";

export class AthleteId extends DomainId {
  public constructor(value: string) {
    super(value, "invalid_athlete_id");
  }
}
