import type { AuthStrategy, ICreateUser } from '@heimdall/common/interfaces';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const AUTH_STRATEGIES: AuthStrategy[] = [
  'local',
  'ldap',
  'github',
  'gitlab',
  'google',
  'okta',
  'oidc',
  'saml',
];

export class CreateUserDto implements ICreateUser {
  @IsIn(AUTH_STRATEGIES)
  @IsNotEmpty()
  @IsString()
  readonly creationMethod!: AuthStrategy;

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

  @IsIn(['user'])
  @IsNotEmpty()
  @IsString()
  readonly role!: string;

  @IsOptional()
  @IsString()
  readonly title: string | undefined;
}
