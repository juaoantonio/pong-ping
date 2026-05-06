import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  INVITATION_EXPIRY_PRESETS,
  type InvitationExpiryPreset,
} from "@/lib/invitations";

export type InvitationUseMode = "one-time" | "reusable";

type InvitationSettingsControlsProps = {
  disabled?: boolean;
  expiresIn: InvitationExpiryPreset;
  expiresInId: string;
  onExpiresInChange: (value: InvitationExpiryPreset) => void;
  onUseModeChange: (value: InvitationUseMode) => void;
  useMode: InvitationUseMode;
  useModeId: string;
};

export function InvitationSettingsControls({
  disabled,
  expiresIn,
  expiresInId,
  onExpiresInChange,
  onUseModeChange,
  useMode,
  useModeId,
}: InvitationSettingsControlsProps) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={expiresInId}>Validade</Label>
        <Select
          disabled={disabled}
          onValueChange={(value) =>
            onExpiresInChange(value as InvitationExpiryPreset)
          }
          value={expiresIn}
        >
          <SelectTrigger id={expiresInId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INVITATION_EXPIRY_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={useModeId}>Uso</Label>
        <Select
          disabled={disabled}
          onValueChange={(value) => onUseModeChange(value as InvitationUseMode)}
          value={useMode}
        >
          <SelectTrigger id={useModeId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one-time">Uso unico</SelectItem>
            <SelectItem value="reusable">Reutilizavel</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
