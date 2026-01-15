import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetSupportDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsOptional()
  @IsString()
  streetAndHouseNumber?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * FormData sends date as string
   * Example: "2025-01-01"
   */
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;

  /**
   * Example: "14:30"
   */
  @IsOptional()
  @IsString()
  time?: string;

  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  subject?: string;

  /**
   * FormData sends boolean as string ("true" / "false")
   */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPrivacyPolicyAccepted?: boolean;
}
