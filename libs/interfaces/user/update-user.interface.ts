export interface IUpdateUser {
  readonly email: string | undefined;
  readonly firstName: string | undefined;
  readonly lastName: string | undefined;
  readonly organization: string | undefined;
  readonly title: string | undefined;
  readonly role: string | undefined;
  readonly password: string | undefined;
  readonly passwordConfirmation: string | undefined;
  readonly forcePasswordChange: boolean | undefined;
  readonly currentPassword: string;
}
