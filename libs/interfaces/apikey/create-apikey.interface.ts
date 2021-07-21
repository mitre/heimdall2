export interface ICreateApiKey {
  readonly userId?: string;
  readonly name?: string;
  readonly currentPassword: string;
}
