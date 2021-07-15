export interface ISlimUser {
  readonly id: string;
  readonly email: string;
  readonly title?: string;
  groupRole?: string;
  readonly firstName?: string;
  readonly lastName?: string;
}
