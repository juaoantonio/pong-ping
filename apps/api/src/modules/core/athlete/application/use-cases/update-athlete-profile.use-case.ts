import { DomainRuleViolation } from "../../../shared/domain";
import { type Athlete } from "../../domain/athlete";
import { AthleteDisplayName } from "../../domain/value-objects/athlete-display-name";
import { AthleteId } from "../../domain/value-objects/athlete-id";
import { AthleteProfile } from "../../domain/value-objects/athlete-profile";
import { type AthleteRepository } from "../../infrastructure/typeorm/repositories/athlete.repository";
import { type AthleteProfileInput } from "./register-athlete.use-case";

export type UpdateAthleteProfileInput = {
  athleteId: string | AthleteId;
  displayName?: string | AthleteDisplayName;
  profile: AthleteProfile | AthleteProfileInput;
};

export class UpdateAthleteProfileUseCase {
  public constructor(private readonly athletes: AthleteRepository) {}

  public async execute(input: UpdateAthleteProfileInput): Promise<Athlete> {
    const athlete = await this.athletes.findById(AthleteId.from(input.athleteId));

    if (!athlete) {
      throw new DomainRuleViolation("athlete_not_found", "Athlete was not found.");
    }

    if (input.displayName) {
      athlete.rename(AthleteDisplayName.from(input.displayName));
    }

    athlete.updateProfile(AthleteProfile.from(input.profile));

    return this.athletes.save(athlete);
  }
}
