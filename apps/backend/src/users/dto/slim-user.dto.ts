import {ISlimUser} from '@heimdall/interfaces';
import {IsOptional, IsString} from 'class-validator';
import {User} from '../user.model';

export class SlimUserDto implements ISlimUser {
  @IsString()
  readonly id: string;

  @IsString()
  readonly email: string;

  @IsOptional()
  @IsString()
  readonly title?: string;

  @IsOptional()
  @IsString()
  readonly groupRole?: string;

  @IsOptional()
  @IsString()
  readonly firstName?: string;

  @IsOptional()
  @IsString()
  readonly lastName?: string;

  constructor(user: User, groupRole: string | undefined = undefined) {
    this.id = user.id;
    this.email = user.email;
    this.title = user.title;
    this.groupRole = groupRole;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
  }
}
