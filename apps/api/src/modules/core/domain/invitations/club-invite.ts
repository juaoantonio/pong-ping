import { type ClubId } from "../clubs";
import { Invitation, type InvitationState } from "./invitation";

type ClubInviteInput = {
  clubId: ClubId;
} & InvitationState;

export class ClubInvite extends Invitation {
  private readonly clubIdValue: ClubId;

  private constructor(input: ClubInviteInput) {
    super(input);
    this.clubIdValue = input.clubId;
  }

  public static create(input: ClubInviteInput): ClubInvite {
    return new ClubInvite(input);
  }

  public get clubId(): ClubId {
    return this.clubIdValue;
  }
}
