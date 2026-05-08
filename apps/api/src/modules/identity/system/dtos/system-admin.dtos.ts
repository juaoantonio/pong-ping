import { ArrayNotEmpty, IsArray, IsBoolean, IsEmail, IsIn, IsOptional, IsString, Length } from "class-validator";
import { TENANT_ROLES, type TenantRole } from "../../entities";

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
  @IsIn(["owner", "admin"])
  ownerRole?: "owner" | "admin";
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
  roles!: TenantRole[];
}

export class UpdateSystemMembershipDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn([...TENANT_ROLES], { each: true })
  roles?: TenantRole[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
