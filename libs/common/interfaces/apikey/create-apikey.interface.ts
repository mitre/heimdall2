export type ICreateApiKey = {
  readonly currentPassword: string;
  readonly groupId?: string;
  readonly name?: string;
  readonly userEmail?: string;
  readonly userId?: string;
};
