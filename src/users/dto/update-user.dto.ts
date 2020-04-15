import { IsEmail } from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  email: string;
}
