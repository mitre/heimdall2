import type {SelectApiKey} from '../../db/zod-schemas';

export class APIKeyDto {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly userId?: string;
  readonly groupId?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(apiKey: SelectApiKey) {
    this.id = String(apiKey.id);
    this.name = apiKey.name ?? '';
    this.type = apiKey.type ?? '';
    this.userId = apiKey.userId != null ? String(apiKey.userId) : undefined;
    this.groupId = apiKey.groupId != null ? String(apiKey.groupId) : undefined;
    this.createdAt = new Date(apiKey.createdAt);
    this.updatedAt = new Date(apiKey.updatedAt);
  }
}
