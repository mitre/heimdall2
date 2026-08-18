import type { AuthStrategy } from '../config/auth-strategy.interface';

export type ICreateUser = {
  readonly creationMethod: AuthStrategy;
  readonly email: string;
  readonly firstName: string | undefined;
  readonly lastName: string | undefined;
  readonly organization: string | undefined;
  readonly password: string;
  readonly passwordConfirmation: string;
  readonly role: string;
  readonly title: string | undefined;
};
