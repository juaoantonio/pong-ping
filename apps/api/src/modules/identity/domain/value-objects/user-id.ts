import { DomainId } from "../../../core/shared/domain";

export class UserId extends DomainId {
  public constructor(value: string) {
    super(value, "invalid_user_id");
  }
}
