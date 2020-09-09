import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsString,
  MinLength
} from 'class-validator';
import {ICreateUser} from '@heimdall/interfaces';

export class CreateUserDto implements ICreateUser {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  readonly password: string;

  @IsNotEmpty()
  @IsString()
  readonly passwordConfirmation: string;

  @IsOptional()
  @IsString()
  readonly firstName: string;

  @IsOptional()
  @IsString()
  readonly lastName: string;

  @IsOptional()
  @IsString()
  readonly organization: string;

  @IsOptional()
  @IsString()
  readonly title: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['user'])
  readonly role: string;
}
