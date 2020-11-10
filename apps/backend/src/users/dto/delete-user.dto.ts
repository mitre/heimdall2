import {IDeleteUser} from '@heimdall/interfaces';
import {IsNotEmpty, IsString, MinLength} from 'class-validator';

export class DeleteUserDto implements IDeleteUser {
  @IsNotEmpty()
  @IsString()
  @MinLength(15)
  readonly password!: string;
}
