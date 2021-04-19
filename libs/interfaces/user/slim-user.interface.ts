export interface ISlimUser {
  readonly id: string;
  readonly email: string;
  readonly title?: string;
  readonly role?: string;
  readonly firstName?: string;
  readonly lastName?: string;
}
