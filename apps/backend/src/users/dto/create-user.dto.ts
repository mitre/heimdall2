import { ICreateUser } from '@heimdall/common/interfaces';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto implements ICreateUser {
  @IsNotEmpty()
  @IsString()
  @IsIn(['local', 'ldap', 'github', 'gitlab', 'google', 'okta', 'ldap'])
  readonly creationMethod!: string;

  @IsEmail()
  @IsNotEmpty()
  readonly email!: string;

  @IsOptional()
  @IsString()
  readonly firstName: string | undefined;

  @IsOptional()
  @IsString()
  readonly lastName: string | undefined;

  @IsOptional()
  @IsString()
  readonly organization: string | undefined;

  @IsNotEmpty()
  @IsString()
  readonly password!: string;

  @IsNotEmpty()
  @IsString()
  readonly passwordConfirmation!: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['user'])
  readonly role!: string;

  @IsOptional()
  @IsString()
  readonly title: string | undefined;
}
