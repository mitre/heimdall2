import { IsEmail } from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  readonly email: string;
}
