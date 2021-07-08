import {ICreateApiKey} from '@heimdall/interfaces';
import {IsString} from 'class-validator';

export class CreateApiKeyDto implements ICreateApiKey {
  @IsString()
  readonly name!: string;

  @IsString()
  readonly currentPassword!: string;
}
