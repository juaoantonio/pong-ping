import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, Length } from "class-validator";
import { INVITATION_EXPIRY_PRESETS, roles } from "@pong-ping/shared";

const expiryValues = INVITATION_EXPIRY_PRESETS.map((preset) => preset.value);

export class UpdateProfileDto {
  @IsString()
  @Length(2, 80)
  name!: string;
}

export class AllowEmailDto {
  @IsEmail()
  email!: string;
}

export class CreateInvitationDto {
  @IsOptional()
  @IsIn(expiryValues)
  expiresIn?: string;

  @IsOptional()
  @IsBoolean()
  oneTimeUse?: boolean;
}

export class LegacyAccessDto extends CreateInvitationDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdateRoleDto {
  @IsIn(roles)
  role!: string;
}

export class CreateRoomDto {
  @IsString()
  @Length(1, 120)
  name!: string;
}

export class AddParticipantDto {
  @IsString()
  userId!: string;
}

export class FinishMatchDto {
  @IsString()
  winnerParticipantId!: string;
}

export class ClaimInvitationDto {
  @IsEmail()
  email!: string;
}
