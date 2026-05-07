import { DomainId } from "../../shared";

export class InviteId extends DomainId {
  public constructor(value: string) {
    super(value, "invalid_invite_id");
  }
}
