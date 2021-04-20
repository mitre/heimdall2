export interface ISlimUser {
  readonly id: string;
  readonly email: string;
  readonly title?: string;
  readonly groupRole?: string | undefined;
  readonly firstName?: string;
  readonly lastName?: string;
}
