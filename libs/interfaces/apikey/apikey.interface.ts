export interface IApiKey {
  id: string;
  readonly name: string;
  readonly apiKey?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
