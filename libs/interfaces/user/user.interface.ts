export interface IUser {
  id: string;
  readonly email: string;
  readonly firstName: string | undefined;
  readonly lastName: string | undefined;
  readonly title: string | undefined;
  readonly role: string;
  readonly organization: string | undefined;
  readonly loginCount: number;
  readonly lastLogin: Date | undefined;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
