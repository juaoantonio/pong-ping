export const INVITATION_EXPIRY_PRESETS = [
  { value: "15m", label: "15 minutos", milliseconds: 15 * 60 * 1000 },
  { value: "1h", label: "1 hora", milliseconds: 60 * 60 * 1000 },
  { value: "1d", label: "1 dia", milliseconds: 24 * 60 * 60 * 1000 },
  { value: "7d", label: "7 dias", milliseconds: 7 * 24 * 60 * 60 * 1000 },
] as const;

export type InvitationExpiryPreset =
  (typeof INVITATION_EXPIRY_PRESETS)[number]["value"];

export function isInvitationExpiryPreset(
  value: unknown,
): value is InvitationExpiryPreset {
  return (
    typeof value === "string" &&
    INVITATION_EXPIRY_PRESETS.some((preset) => preset.value === value)
  );
}

export function getInvitationExpiry(
  preset: InvitationExpiryPreset = "15m",
  now = Date.now(),
) {
  const duration = INVITATION_EXPIRY_PRESETS.find(
    (option) => option.value === preset,
  )?.milliseconds;

  if (!duration) {
    throw new Error("invalid_invitation_expiry_preset");
  }

  return new Date(now + duration);
}

export function getInvitationExpiryLabel(value: InvitationExpiryPreset) {
  return (
    INVITATION_EXPIRY_PRESETS.find((preset) => preset.value === value)?.label ??
    value
  );
}
