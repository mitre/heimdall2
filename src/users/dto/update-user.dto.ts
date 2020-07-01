import {IsEmail, IsOptional, IsNotEmpty} from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  readonly email: string;

  @IsOptional()
  readonly firstName: string;

  @IsOptional()
  readonly lastName: string;

  @IsOptional()
  readonly organization: string;

  @IsOptional()
  readonly title: string;

  @IsOptional()
  readonly role: string;

  @IsOptional()
  readonly password: string;

  @IsOptional()
  readonly passwordConfirmation: string;

  @IsOptional()
  readonly forcePasswordChange: boolean;

  @IsNotEmpty()
  readonly currentPassword: string;
}
