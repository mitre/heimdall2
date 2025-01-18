import {IDeleteUser} from '@heimdall/common/interfaces';
import {IsOptional, IsString, MinLength} from 'class-validator';

export class DeleteUserDto implements IDeleteUser {
  @IsOptional()
  @IsString()
  @MinLength(15)
  readonly password?: string;
}
