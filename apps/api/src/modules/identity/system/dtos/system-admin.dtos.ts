import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TENANT_ADMIN_ROLES, TENANT_ROLES, type IdentityTenantRole } from "../../identity-roles";

export class CreateSystemTenantRequestDto {
  @ApiProperty({ example: "Downtown Table Tennis Club", minLength: 1, maxLength: 160 })
  @IsString()
  @Length(1, 160)
  name!: string;

  @ApiProperty({ example: "downtown-ttc", minLength: 1, maxLength: 63 })
  @IsString()
  @Length(1, 63)
  slug!: string;

  @ApiProperty({ example: "owner@example.com" })
  @IsEmail()
  ownerEmail!: string;

  @ApiPropertyOptional({ enum: TENANT_ADMIN_ROLES, example: "owner" })
  @IsOptional()
  @IsIn([...TENANT_ADMIN_ROLES])
  ownerRole?: (typeof TENANT_ADMIN_ROLES)[number];
}

export class UpdateSystemTenantRequestDto {
  @ApiPropertyOptional({ example: "Downtown Table Tennis Club", minLength: 1, maxLength: 160 })
  @IsOptional()
  @IsString()
  @Length(1, 160)
  name?: string;

  @ApiPropertyOptional({ example: "downtown-ttc", minLength: 1, maxLength: 63 })
  @IsOptional()
  @IsString()
  @Length(1, 63)
  slug?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateSystemMembershipRequestDto {
  @ApiProperty({ example: "member@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: TENANT_ROLES, isArray: true, example: ["member"] })
  @IsArray()
  @ArrayNotEmpty()
  @IsIn([...TENANT_ROLES], { each: true })
  roles!: IdentityTenantRole[];
}

export class UpdateSystemMembershipRequestDto {
  @ApiPropertyOptional({ enum: TENANT_ROLES, isArray: true, example: ["admin"] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn([...TENANT_ROLES], { each: true })
  roles?: IdentityTenantRole[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class SystemTenantResponseDto {
  @ApiProperty({ example: "018f08f1-54a7-7181-8d75-59336a3a6e2b" })
  id!: string;

  @ApiProperty({ example: "Downtown Table Tennis Club" })
  name!: string;

  @ApiProperty({ example: "downtown-ttc" })
  slug!: string;

  @ApiProperty({ example: true })
  active!: boolean;

  @ApiProperty({ type: String, format: "date-time", example: "2026-05-08T20:00:00.000Z" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time", example: "2026-05-08T20:00:00.000Z" })
  updatedAt!: Date;

  @ApiProperty({ example: 12 })
  activeMembershipCount!: number;

  @ApiProperty({ type: [String], example: ["owner@example.com", "admin@example.com"] })
  ownerAdminEmails!: string[];
}

export class SystemMembershipResponseDto {
  @ApiProperty({ example: "018f08f1-62d5-7931-9b7c-3a7e08063f15" })
  id!: string;

  @ApiProperty({ example: "018f08f1-54a7-7181-8d75-59336a3a6e2b" })
  tenantId!: string;

  @ApiProperty({ example: "018f08f1-5154-7687-9051-48b4cfa13f77" })
  userId!: string;

  @ApiProperty({ example: "member@example.com" })
  email!: string;

  @ApiProperty({ enum: TENANT_ROLES, isArray: true, example: ["member"] })
  roles!: IdentityTenantRole[];

  @ApiProperty({ example: true })
  active!: boolean;

  @ApiProperty({ type: String, format: "date-time", example: "2026-05-08T20:00:00.000Z" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time", example: "2026-05-08T20:00:00.000Z" })
  updatedAt!: Date;
}

export class SystemMembershipDeactivationResponseDto {
  @ApiProperty({ example: true })
  deactivated!: true;
}
