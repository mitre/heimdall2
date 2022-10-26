export interface ICreateApiKey {
  readonly userId?: string;
  readonly userEmail?: string;
  readonly name?: string;
  readonly currentPassword: string;
}
