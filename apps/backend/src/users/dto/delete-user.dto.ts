import {IsNotEmpty, IsString, MinLength} from 'class-validator';
import {IDeleteUser} from '@heimdall/interfaces';

export class DeleteUserDto implements IDeleteUser {
  @IsNotEmpty()
  @IsString()
  @MinLength(15)
  readonly password!: string;
}
