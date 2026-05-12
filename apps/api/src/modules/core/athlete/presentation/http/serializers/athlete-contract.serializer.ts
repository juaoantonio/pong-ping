import type { AthleteProfileContract, AthleteResponseContract } from "@pong-ping/contracts";
import { type Athlete, type AthleteProfile } from "../../../domain";

export function toAthleteResponse(athlete: Athlete): AthleteResponseContract {
  return {
    id: athlete.id.value,
    clubId: athlete.clubId.value,
    userId: athlete.userId.value,
    displayName: athlete.displayName.value,
    profile: toAthleteProfileResponse(athlete.profile),
  };
}

export function toAthleteProfileResponse(profile: AthleteProfile): AthleteProfileContract {
  return {
    technicalLevel: profile.technicalLevel,
    gripStyle: profile.gripStyle,
    playingStyle: profile.playingStyle,
    bladeName: profile.bladeName?.value ?? null,
    forehandRubberName: profile.forehandRubberName?.value ?? null,
    backhandRubberName: profile.backhandRubberName?.value ?? null,
    equipmentNotes: profile.equipmentNotes?.value ?? null,
  };
}
