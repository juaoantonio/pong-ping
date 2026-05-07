import { describe, expect, it } from "vitest";
import { ClubId } from "../../club/domain";
import { UserId } from "../../../identity/domain";
import { DomainRuleViolation } from "../../shared/domain";
import { Athlete } from "./athlete";
import { AthleteId } from "./value-objects/athlete-id";
import { AthleteDisplayName } from "./value-objects/athlete-display-name";
import { AthleteEquipmentText } from "./value-objects/athlete-equipment-text";
import { ATHLETE_GRIP_STYLE } from "./value-objects/athlete-grip-style.enum";
import { ATHLETE_PLAYING_STYLE } from "./value-objects/athlete-playing-style.enum";
import { AthleteProfile } from "./value-objects/athlete-profile";
import { ATHLETE_TECHNICAL_LEVEL } from "./value-objects/athlete-technical-level.enum";

describe("dominio de atletas", () => {
  it("registra um atleta como limite esportivo em torno de uma identidade de usuario", () => {
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

  it("renomeia o atleta e atualiza campos tecnicos e de equipamentos do perfil", () => {
    const athlete = Athlete.register({
      id: new AthleteId("athlete-1"),
      clubId: new ClubId("club-1"),
      userId: new UserId("user-1"),
      displayName: new AthleteDisplayName("Nico"),
    });

    athlete.rename(new AthleteDisplayName("Nico Spin"));
    athlete.updateProfile(
      AthleteProfile.create({
        technicalLevel: ATHLETE_TECHNICAL_LEVEL.ADVANCED,
        gripStyle: ATHLETE_GRIP_STYLE.CLASSIC,
        playingStyle: ATHLETE_PLAYING_STYLE.OFFENSIVE,
        bladeName: AthleteEquipmentText.optionalName("  Carbon Blade  "),
        forehandRubberName: AthleteEquipmentText.optionalName(" Fast Arc "),
        backhandRubberName: AthleteEquipmentText.optionalName(" Control Arc "),
        equipmentNotes: AthleteEquipmentText.optionalNotes("  Likes tacky setups. "),
      }),
    );

    expect(athlete.displayName.value).toBe("Nico Spin");
    expect(athlete.profile.technicalLevel).toBe(ATHLETE_TECHNICAL_LEVEL.ADVANCED);
    expect(athlete.profile.bladeName?.value).toBe("Carbon Blade");
    expect(athlete.profile.equipmentNotes?.value).toBe("Likes tacky setups.");
  });

  it("normaliza textos de equipamento em branco para null e rejeita texto invalido de atleta", () => {
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
