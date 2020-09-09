import {IsEmail, IsNotEmpty, IsOptional} from 'class-validator';
import {ICreateUser} from '@heimdall/interfaces';

export class CreateUserDto implements ICreateUser {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsNotEmpty()
  readonly password: string;

  @IsNotEmpty()
  readonly passwordConfirmation: string;

  @IsOptional()
  readonly firstName: string;

  @IsOptional()
  readonly lastName: string;

  @IsOptional()
  readonly organization: string;

  @IsOptional()
  readonly title: string;

  @IsNotEmpty()
  readonly role: string;
}
