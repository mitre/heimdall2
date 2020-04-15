import { User } from '../user.model';

export class UserDto {
  id: number;
  readonly email: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
