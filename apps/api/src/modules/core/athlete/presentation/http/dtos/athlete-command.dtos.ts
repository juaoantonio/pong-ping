import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, Length, ValidateNested } from "class-validator";
import {
  ATHLETE_GRIP_STYLE_CONTRACT,
  ATHLETE_PLAYING_STYLE_CONTRACT,
  ATHLETE_TECHNICAL_LEVEL_CONTRACT,
  type AthleteProfileContract,
  type AthleteResponseContract,
  type RegisterAthleteRequestContract,
  type UpdateAthleteProfileRequestContract,
} from "@pong-ping/contracts";

const TECHNICAL_LEVELS = Object.values(ATHLETE_TECHNICAL_LEVEL_CONTRACT);
const GRIP_STYLES = Object.values(ATHLETE_GRIP_STYLE_CONTRACT);
const PLAYING_STYLES = Object.values(ATHLETE_PLAYING_STYLE_CONTRACT);

export class AthleteProfileDto implements AthleteProfileContract {
  @ApiPropertyOptional({ enum: TECHNICAL_LEVELS, nullable: true, example: "advanced" })
  @IsOptional()
  @IsIn(TECHNICAL_LEVELS)
  technicalLevel!: AthleteProfileContract["technicalLevel"];

  @ApiPropertyOptional({ enum: GRIP_STYLES, nullable: true, example: "classic" })
  @IsOptional()
  @IsIn(GRIP_STYLES)
  gripStyle!: AthleteProfileContract["gripStyle"];

  @ApiPropertyOptional({ enum: PLAYING_STYLES, nullable: true, example: "offensive" })
  @IsOptional()
  @IsIn(PLAYING_STYLES)
  playingStyle!: AthleteProfileContract["playingStyle"];

  @ApiPropertyOptional({ nullable: true, example: "Carbon Blade" })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  bladeName!: string | null;

  @ApiPropertyOptional({ nullable: true, example: "Fast Rubber" })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  forehandRubberName!: string | null;

  @ApiPropertyOptional({ nullable: true, example: "Control Rubber" })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  backhandRubberName!: string | null;

  @ApiPropertyOptional({ nullable: true, example: "Prefers spin drills." })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  equipmentNotes!: string | null;
}

export class RegisterAthleteRequestDto implements RegisterAthleteRequestContract {
  @ApiProperty({ example: "Nico Pong", minLength: 2, maxLength: 120 })
  @IsString()
  @Length(2, 120)
  displayName!: string;

  @ApiPropertyOptional({ type: AthleteProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AthleteProfileDto)
  profile?: Partial<AthleteProfileDto>;
}

export class UpdateAthleteProfileRequestDto implements UpdateAthleteProfileRequestContract {
  @ApiPropertyOptional({ example: "Nico Spin", minLength: 2, maxLength: 120 })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  displayName?: string;

  @ApiProperty({ type: AthleteProfileDto })
  @ValidateNested()
  @Type(() => AthleteProfileDto)
  profile!: Partial<AthleteProfileDto>;
}

export class AthleteResponseDto implements AthleteResponseContract {
  @ApiProperty({ example: "018f08f1-62d5-7931-9b7c-3a7e08063f15" })
  id!: string;

  @ApiProperty({ example: "018f08f1-54a7-7181-8d75-59336a3a6e2b" })
  clubId!: string;

  @ApiProperty({ example: "018f08f1-5154-7687-9051-48b4cfa13f77" })
  userId!: string;

  @ApiProperty({ example: "Nico Pong" })
  displayName!: string;

  @ApiProperty({ type: AthleteProfileDto })
  profile!: AthleteProfileDto;
}
