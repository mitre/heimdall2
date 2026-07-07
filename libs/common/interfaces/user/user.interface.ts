export type IUser = {
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
};
