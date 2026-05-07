import { DomainId } from "../../shared";

export class ClubId extends DomainId {
  public constructor(value: string) {
    super(value, "invalid_club_id");
  }
}
