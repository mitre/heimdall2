export interface IUser {
  id: number;
  readonly email: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly title: string | null;
  readonly role: string;
  readonly organization: string | null;
  readonly loginCount: number;
  readonly lastLogin: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
