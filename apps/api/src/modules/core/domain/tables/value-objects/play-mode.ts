import { DomainRuleViolation } from "../../shared";

const PLAY_MODE_VALUES = ["singles", "doubles"] as const;

type PlayModeValue = (typeof PLAY_MODE_VALUES)[number];

export class PlayMode {
  public readonly value: PlayModeValue;

  public constructor(value: string) {
    const normalized = value.trim().toLowerCase();

    if (!isPlayModeValue(normalized)) {
      throw new DomainRuleViolation("invalid_play_mode", "Play mode must be singles or doubles.");
    }

    this.value = normalized;
  }

  public get athletesPerSide(): number {
    return this.value === "singles" ? 1 : 2;
  }

  public get requiredAthletes(): number {
    return this.athletesPerSide * 2;
  }

  public equals(other: PlayMode): boolean {
    return this.value === other.value;
  }
}

function isPlayModeValue(value: string): value is PlayModeValue {
  return PLAY_MODE_VALUES.includes(value as PlayModeValue);
}
