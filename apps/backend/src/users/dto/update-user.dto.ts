import {
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsString,
  IsIn,
  IsBoolean
} from 'class-validator';
import {IUpdateUser} from '@heimdall/interfaces';

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
  @IsIn(['user'])
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

  @IsNotEmpty()
  @IsString()
  readonly currentPassword!: string;
}
