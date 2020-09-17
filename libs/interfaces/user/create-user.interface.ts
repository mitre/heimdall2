export interface ICreateUser {
  readonly email: string;
  readonly password: string;
  readonly passwordConfirmation: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly organization: string;
  readonly title: string;
  readonly role: string;
}
