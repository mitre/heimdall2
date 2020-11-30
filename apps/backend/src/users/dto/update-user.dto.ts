import {IUpdateUser} from '@heimdall/interfaces';
import {IsBoolean, IsEmail, IsIn, IsOptional, IsString} from 'class-validator';

export class UpdateUserDto implements IUpdateUser {
  @IsEmail()
  @IsOptional()
  readonly email: string | undefined;

  @IsOptional()
  @IsString()
  readonly firstName!: string | undefined;

  @IsOptional()
  @IsString()
  readonly lastName!: string | undefined;

  @IsOptional()
  @IsString()
  readonly organization!: string | undefined;

  @IsOptional()
  @IsString()
  readonly title!: string | undefined;

  @IsOptional()
  @IsString()
  @IsIn(['user', 'admin'])
  readonly role: string | undefined;

  @IsOptional()
  @IsString()
  readonly password: string | undefined;

  @IsOptional()
  @IsString()
  readonly passwordConfirmation: string | undefined;

  @IsOptional()
  @IsBoolean()
  readonly forcePasswordChange: boolean | undefined;

  @IsOptional()
  @IsString()
  readonly currentPassword?: string;
}
