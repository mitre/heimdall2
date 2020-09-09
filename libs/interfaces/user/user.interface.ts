export interface IUser {
  id: number;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly title: string;
  readonly role: string;
  readonly organization: string;
  readonly loginCount: number;
  readonly lastLogin: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
