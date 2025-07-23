import {IUser} from '@heimdall/common/interfaces';
import {User} from '../user.model';

export class UserDto implements IUser {
  id: string;
  readonly email: string;
  readonly firstName: string | undefined;
  readonly lastName: string | undefined;
  readonly title: string | undefined;
  readonly role: string;
  readonly organization: string | undefined;
  readonly loginCount: number;
  readonly lastLogin: Date | undefined;
  readonly creationMethod: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.title = user.title;
    this.role = user.role;
    this.organization = user.organization;
    this.loginCount = user.loginCount;
    this.lastLogin = user.lastLogin;
    this.creationMethod = user.creationMethod;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
