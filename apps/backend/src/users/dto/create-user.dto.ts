import {IsEmail, IsNotEmpty, IsOptional, IsIn, IsString} from 'class-validator';
import {ICreateUser} from '@heimdall/interfaces';

export class CreateUserDto implements ICreateUser {
  @IsEmail()
  @IsNotEmpty()
  readonly email!: string;

  @IsNotEmpty()
  @IsString()
  readonly password!: string;

  @IsNotEmpty()
  @IsString()
  readonly passwordConfirmation!: string;

  @IsOptional()
  @IsString()
  readonly firstName: string | undefined;

  @IsOptional()
  @IsString()
  readonly lastName: string | undefined;

  @IsOptional()
  @IsString()
  readonly organization: string | undefined;

  @IsOptional()
  @IsString()
  readonly title: string | undefined;

  @IsNotEmpty()
  @IsString()
  @IsIn(['user'])
  readonly role!: string;
}
