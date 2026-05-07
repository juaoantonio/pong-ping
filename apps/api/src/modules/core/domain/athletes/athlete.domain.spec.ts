import { describe, expect, it } from "vitest";
import { ClubId } from "../clubs";
import { UserId } from "../../../identity/domain";
import { DomainRuleViolation } from "../shared";
import { Athlete } from "./athlete";
import { AthleteId } from "./value-objects/athlete-id";
import { AthleteDisplayName } from "./value-objects/athlete-display-name";
import { AthleteEquipmentText } from "./value-objects/athlete-equipment-text";
import { AthleteGripStyle } from "./value-objects/athlete-grip-style";
import { AthletePlayingStyle } from "./value-objects/athlete-playing-style";
import { AthleteProfile } from "./value-objects/athlete-profile";
import { AthleteTechnicalLevel } from "./value-objects/athlete-technical-level";

describe("Athlete domain", () => {
  it("registers an athlete as the sports boundary around a user identity", () => {
    const athlete = Athlete.register({
      id: new AthleteId("athlete-1"),
      clubId: new ClubId("club-1"),
      userId: new UserId("user-1"),
      displayName: new AthleteDisplayName("  Nico   Pong  "),
    });

    expect(athlete.clubId.value).toBe("club-1");
    expect(athlete.userId.value).toBe("user-1");
    expect(athlete.displayName.value).toBe("Nico Pong");
    expect(athlete.profile.technicalLevel).toBeNull();
  });

  it("renames the athlete and updates technical and equipment profile fields", () => {
    const athlete = Athlete.register({
      id: new AthleteId("athlete-1"),
      clubId: new ClubId("club-1"),
      userId: new UserId("user-1"),
      displayName: new AthleteDisplayName("Nico"),
    });

    athlete.rename(new AthleteDisplayName("Nico Spin"));
    athlete.updateProfile(
      AthleteProfile.create({
        technicalLevel: AthleteTechnicalLevel.ADVANCED,
        gripStyle: AthleteGripStyle.CLASSIC,
        playingStyle: AthletePlayingStyle.OFFENSIVE,
        bladeName: AthleteEquipmentText.optionalName("  Carbon Blade  "),
        forehandRubberName: AthleteEquipmentText.optionalName(" Fast Arc "),
        backhandRubberName: AthleteEquipmentText.optionalName(" Control Arc "),
        equipmentNotes: AthleteEquipmentText.optionalNotes("  Likes tacky setups. "),
      }),
    );

    expect(athlete.displayName.value).toBe("Nico Spin");
    expect(athlete.profile.technicalLevel).toBe(AthleteTechnicalLevel.ADVANCED);
    expect(athlete.profile.bladeName?.value).toBe("Carbon Blade");
    expect(athlete.profile.equipmentNotes?.value).toBe("Likes tacky setups.");
  });

  it("normalizes blank equipment strings to null and rejects invalid athlete text", () => {
    const emptyProfile = AthleteProfile.create({
      bladeName: AthleteEquipmentText.optionalName("   "),
      equipmentNotes: AthleteEquipmentText.optionalNotes(null),
    });

    expect(emptyProfile.bladeName).toBeNull();
    expect(emptyProfile.equipmentNotes).toBeNull();
    expect(() => new AthleteDisplayName("x")).toThrow(DomainRuleViolation);
    expect(() => AthleteEquipmentText.optionalName("x".repeat(121))).toThrow(DomainRuleViolation);
  });
});
