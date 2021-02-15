export interface ISlimUser {
  readonly id: string;
  readonly email: string;
  readonly firstName?: string | undefined;
  readonly lastName?: string | undefined;
}
