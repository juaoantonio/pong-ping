import { type AthleteEquipmentText } from "./athlete-equipment-text";
import { type AthleteGripStyle } from "./athlete-grip-style";
import { type AthletePlayingStyle } from "./athlete-playing-style";
import { type AthleteTechnicalLevel } from "./athlete-technical-level";

type AthleteProfileInput = {
  technicalLevel?: AthleteTechnicalLevel | null;
  gripStyle?: AthleteGripStyle | null;
  playingStyle?: AthletePlayingStyle | null;
  bladeName?: AthleteEquipmentText | null;
  forehandRubberName?: AthleteEquipmentText | null;
  backhandRubberName?: AthleteEquipmentText | null;
  equipmentNotes?: AthleteEquipmentText | null;
};

export class AthleteProfile {
  public readonly technicalLevel: AthleteTechnicalLevel | null;
  public readonly gripStyle: AthleteGripStyle | null;
  public readonly playingStyle: AthletePlayingStyle | null;
  public readonly bladeName: AthleteEquipmentText | null;
  public readonly forehandRubberName: AthleteEquipmentText | null;
  public readonly backhandRubberName: AthleteEquipmentText | null;
  public readonly equipmentNotes: AthleteEquipmentText | null;

  private constructor(input: AthleteProfileInput) {
    this.technicalLevel = input.technicalLevel ?? null;
    this.gripStyle = input.gripStyle ?? null;
    this.playingStyle = input.playingStyle ?? null;
    this.bladeName = input.bladeName ?? null;
    this.forehandRubberName = input.forehandRubberName ?? null;
    this.backhandRubberName = input.backhandRubberName ?? null;
    this.equipmentNotes = input.equipmentNotes ?? null;
  }

  public static create(input: AthleteProfileInput = {}): AthleteProfile {
    return new AthleteProfile(input);
  }

  public static empty(): AthleteProfile {
    return new AthleteProfile({});
  }
}
