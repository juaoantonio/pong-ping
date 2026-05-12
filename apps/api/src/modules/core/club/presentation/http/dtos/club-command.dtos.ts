import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";
import type {
  ChangeClubSlugRequestContract,
  ClubResponseContract,
  CreateClubRequestContract,
  ISODateString,
  RenameClubRequestContract,
} from "@pong-ping/contracts";

export class CreateClubRequestDto implements CreateClubRequestContract {
  @ApiProperty({ example: "Downtown Table Tennis Club", minLength: 2, maxLength: 160 })
  @IsString()
  @Length(2, 160)
  name!: string;

  @ApiProperty({ example: "downtown-ttc", minLength: 1, maxLength: 63 })
  @IsString()
  @Length(1, 63)
  slug!: string;
}

export class RenameClubRequestDto implements RenameClubRequestContract {
  @ApiProperty({ example: "Downtown Table Tennis Club", minLength: 2, maxLength: 160 })
  @IsString()
  @Length(2, 160)
  name!: string;
}

export class ChangeClubSlugRequestDto implements ChangeClubSlugRequestContract {
  @ApiProperty({ example: "downtown-ttc", minLength: 1, maxLength: 63 })
  @IsString()
  @Length(1, 63)
  slug!: string;
}

export class ClubResponseDto implements ClubResponseContract {
  @ApiProperty({ example: "018f08f1-54a7-7181-8d75-59336a3a6e2b" })
  id!: string;

  @ApiProperty({ example: "Downtown Table Tennis Club" })
  name!: string;

  @ApiProperty({ example: "downtown-ttc" })
  slug!: string;

  @ApiProperty({ example: true })
  active!: boolean;

  @ApiProperty({ type: String, format: "date-time", example: "2026-05-08T20:00:00.000Z" })
  createdAt!: ISODateString;
}
