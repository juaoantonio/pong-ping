import { ActorId } from "../../shared/domain";

export type IdentityPrincipalForCore = {
  userId: string;
};

export class CoreIdentityTranslator {
  public toActorId(principal: IdentityPrincipalForCore): ActorId {
    return ActorId.from(principal.userId);
  }
}
