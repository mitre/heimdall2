import type { IUser } from '@heimdall/common/interfaces';
import type { User } from '../user.model';

export class UserDto implements IUser {
  readonly createdAt: Date;
  readonly creationMethod: string;
  readonly email: string;
  readonly firstName: string | undefined;
  id: string;
  readonly lastLogin: Date | undefined;
  readonly lastName: string | undefined;
  readonly loginCount: number;
  readonly organization: string | undefined;
  readonly role: string;
  readonly title: string | undefined;
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
