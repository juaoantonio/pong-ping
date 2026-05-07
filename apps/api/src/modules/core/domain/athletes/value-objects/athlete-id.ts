import { DomainId } from "../../shared";

export class AthleteId extends DomainId {
  public constructor(value: string) {
    super(value, "invalid_athlete_id");
  }
}
