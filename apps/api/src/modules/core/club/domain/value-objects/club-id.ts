import { DomainId } from "../../../shared/domain";

export class ClubId extends DomainId {
  public constructor(value: string) {
    super(value, "invalid_club_id");
  }
}
