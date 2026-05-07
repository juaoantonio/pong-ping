import { type ClubId } from "../../club/domain";
import { AggregateRoot, type ActorId } from "../../shared/domain";
import { type AthleteId } from "./value-objects/athlete-id";
import { type AthleteDisplayName } from "./value-objects/athlete-display-name";
import { AthleteProfile } from "./value-objects/athlete-profile";

type AthleteRegistration = {
  id: AthleteId;
  clubId: ClubId;
  userId: ActorId;
  displayName: AthleteDisplayName;
  profile?: AthleteProfile;
};

export class Athlete extends AggregateRoot<AthleteId> {
  public readonly clubId: ClubId;
  public readonly userId: ActorId;
  private displayNameValue: AthleteDisplayName;
  private profileValue: AthleteProfile;

  private constructor(registration: AthleteRegistration) {
    super(registration.id);
    this.clubId = registration.clubId;
    this.userId = registration.userId;
    this.displayNameValue = registration.displayName;
    this.profileValue = registration.profile ?? AthleteProfile.empty();
  }

  public static register(registration: AthleteRegistration): Athlete {
    return new Athlete(registration);
  }

  public get displayName(): AthleteDisplayName {
    return this.displayNameValue;
  }

  public get profile(): AthleteProfile {
    return this.profileValue;
  }

  public rename(displayName: AthleteDisplayName): void {
    this.displayNameValue = displayName;
  }

  public updateProfile(profile: AthleteProfile): void {
    this.profileValue = profile;
  }
}
