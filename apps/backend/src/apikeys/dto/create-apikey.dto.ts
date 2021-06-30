import {ICreateApiKey} from '@heimdall/interfaces';
import {IsOptional, IsString} from 'class-validator';

export class CreateApiKeyDto implements ICreateApiKey {
  readonly name!: string;

  @IsOptional()
  @IsString()
  readonly currentPassword!: string;
}
