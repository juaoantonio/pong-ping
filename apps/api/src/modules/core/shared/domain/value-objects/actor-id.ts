import { DomainId } from "./domain-id";

export class ActorId extends DomainId {
  public constructor(value: string) {
    super(value, "invalid_actor_id");
  }
}
