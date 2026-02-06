import {IApiKey} from '@heimdall/common/interfaces';
import {ApiKey} from '../apikey.model';

export class APIKeyDto implements IApiKey {
  readonly id!: string;
  readonly name!: string;
  readonly type!: string;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  constructor(apiKey: ApiKey) {
    this.id = apiKey.id;
    this.name = apiKey.name;
    this.type = apiKey.type;
    this.createdAt = apiKey.createdAt;
    this.updatedAt = apiKey.updatedAt;
  }
}
