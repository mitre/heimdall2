import type {SelectUser} from '../../db/zod-schemas';

export class UserDto {
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

  constructor(user: SelectUser) {
    this.id = String(user.id);
    this.email = user.email;
    this.firstName = user.firstName ?? undefined;
    this.lastName = user.lastName ?? undefined;
    this.title = user.title ?? undefined;
    this.role = user.role;
    this.organization = user.organization ?? undefined;
    this.loginCount = user.loginCount;
    this.lastLogin = user.lastLogin ? new Date(user.lastLogin) : undefined;
    this.creationMethod = user.creationMethod;
    this.createdAt = new Date(user.createdAt);
    this.updatedAt = new Date(user.updatedAt);
  }
}
