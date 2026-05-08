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
import { TENANT_ADMIN_ROLES, TENANT_ROLES, type IdentityTenantRole } from "../../identity-roles";

export class CreateSystemTenantDto {
  @IsString()
  @Length(1, 160)
  name!: string;

  @IsString()
  @Length(1, 63)
  slug!: string;

  @IsEmail()
  ownerEmail!: string;

  @IsOptional()
  @IsIn([...TENANT_ADMIN_ROLES])
  ownerRole?: (typeof TENANT_ADMIN_ROLES)[number];
}

export class UpdateSystemTenantDto {
  @IsOptional()
  @IsString()
  @Length(1, 160)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 63)
  slug?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateSystemMembershipDto {
  @IsEmail()
  email!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn([...TENANT_ROLES], { each: true })
  roles!: IdentityTenantRole[];
}

export class UpdateSystemMembershipDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn([...TENANT_ROLES], { each: true })
  roles?: IdentityTenantRole[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
