import { IUpdateUser } from '@heimdall/common/interfaces';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto implements IUpdateUser {
  @IsOptional()
  @IsString()
  readonly currentPassword?: string;

  @IsEmail()
  @IsOptional()
  readonly email: string | undefined;

  @IsOptional()
  @IsString()
  readonly firstName!: string | undefined;

  @IsBoolean()
  @IsOptional()
  readonly forcePasswordChange: boolean | undefined;

  @IsOptional()
  @IsString()
  readonly lastName!: string | undefined;

  @IsOptional()
  @IsString()
  readonly organization!: string | undefined;

  @IsOptional()
  @IsString()
  readonly password: string | undefined;

  @IsOptional()
  @IsString()
  readonly passwordConfirmation: string | undefined;

  @IsIn(['user', 'admin'])
  @IsOptional()
  @IsString()
  readonly role: string | undefined;

  @IsOptional()
  @IsString()
  readonly title!: string | undefined;
}
