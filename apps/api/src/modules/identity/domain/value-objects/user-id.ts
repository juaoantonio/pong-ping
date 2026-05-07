import { DomainId } from "../../../core/domain/shared";

export class UserId extends DomainId {
  public constructor(value: string) {
    super(value, "invalid_user_id");
  }
}
