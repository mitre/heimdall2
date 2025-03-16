export interface ICreateApiKey {
  readonly userId?: string;
  readonly groupId?: string;
  readonly userEmail?: string;
  readonly name?: string;
  readonly currentPassword: string;
}
