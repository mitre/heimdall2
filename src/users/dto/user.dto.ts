import { User } from '../user.model';

export class UserDto {
  id: number;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly title: string;
  readonly role: string;
  readonly organization: string;
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
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
