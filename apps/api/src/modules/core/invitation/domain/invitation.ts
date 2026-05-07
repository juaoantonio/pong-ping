import { randomUUID } from "node:crypto";
import { AggregateRoot, type ActorId } from "../../shared/domain";
import { InvitationClaim } from "./invitation-claim";
import { type InvitationExpiration } from "./invitation-expiration";
import { InvitationPolicy } from "./invitation-policy";
import { type InvitationToken } from "./invitation-token";
import { InviteId } from "./value-objects/invite-id";

export type InvitationState = {
  id?: InviteId;
  token: InvitationToken;
  expiration: InvitationExpiration;
  reusable?: boolean;
  claims?: InvitationClaim[];
};

export type ClaimInvitationInput = {
  claimedAt: Date;
  claimedBy: ActorId;
};

export abstract class Invitation extends AggregateRoot<InviteId> {
  private readonly tokenValue: InvitationToken;
  private readonly expirationValue: InvitationExpiration;
  private readonly reusableValue: boolean;
  private readonly claimsValue: InvitationClaim[];

  protected constructor(input: InvitationState) {
    super(input.id ?? new InviteId(randomUUID()));
    this.tokenValue = input.token;
    this.expirationValue = input.expiration;
    this.reusableValue = input.reusable ?? false;
    this.claimsValue = [...(input.claims ?? [])];
  }

  public get token(): InvitationToken {
    return this.tokenValue;
  }

  public get expiration(): InvitationExpiration {
    return this.expirationValue;
  }

  public get reusable(): boolean {
    return this.reusableValue;
  }

  public get claims(): readonly InvitationClaim[] {
    return this.claimsValue;
  }

  public claim(input: ClaimInvitationInput): InvitationClaim {
    new InvitationPolicy().ensureAvailable(this, input.claimedAt);

    const claim = new InvitationClaim(input);
    this.claimsValue.push(claim);

    return claim;
  }
}
