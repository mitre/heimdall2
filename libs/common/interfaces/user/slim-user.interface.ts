export interface ISlimUser {
  readonly id: string;
  readonly email: string;
  readonly title?: string;
  readonly groupRole?: string;
  readonly firstName?: string;
  readonly lastName?: string;
}
