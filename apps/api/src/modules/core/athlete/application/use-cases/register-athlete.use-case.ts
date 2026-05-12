import { ClubId } from "../../../club/domain";
import { ActorId, DomainRuleViolation } from "../../../shared/domain";
import { Athlete } from "../../domain/athlete";
import { AthleteDisplayName } from "../../domain/value-objects/athlete-display-name";
import { AthleteId } from "../../domain/value-objects/athlete-id";
import {
  AthleteProfile,
  type AthleteProfileData,
} from "../../domain/value-objects/athlete-profile";
import { type AthleteRepository } from "../../infrastructure/typeorm/repositories/athlete.repository";

export type AthleteProfileInput = AthleteProfileData;

export type RegisterAthleteInput = {
  id: string | AthleteId;
  clubId: string | ClubId;
  userId: string | ActorId;
  displayName: string | AthleteDisplayName;
  profile?: AthleteProfile | AthleteProfileInput;
};

export class RegisterAthleteUseCase {
  public constructor(private readonly athletes: AthleteRepository) {}

  public async execute(input: RegisterAthleteInput): Promise<Athlete> {
    const userId = ActorId.from(input.userId);

    if (await this.athletes.findByUserId(userId)) {
      throw new DomainRuleViolation(
        "athlete_already_registered",
        "User already has an athlete registration.",
      );
    }

    const athlete = Athlete.register({
      id: AthleteId.from(input.id),
      clubId: ClubId.from(input.clubId),
      userId,
      displayName: AthleteDisplayName.from(input.displayName),
      profile: AthleteProfile.from(input.profile),
    });

    return this.athletes.save(athlete);
  }
}
