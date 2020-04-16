import { IsEmail, IsOptional } from 'class-validator';

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
}
