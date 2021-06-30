import {IApiKey} from '@heimdall/interfaces';
import {ApiKey} from '../apikey.model';

export class APIKeyDto implements IApiKey {
  readonly id!: string;
  readonly name!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(apiKey: ApiKey) {
    this.id = apiKey.id;
    this.name = apiKey.name;
    this.createdAt = apiKey.createdAt;
    this.updatedAt = apiKey.updatedAt;
  }
}
