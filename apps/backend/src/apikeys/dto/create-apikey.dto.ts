import {ICreateApiKey} from '@heimdall/interfaces';
import {IsOptional, IsString} from 'class-validator';

export class CreateApiKeyDto implements ICreateApiKey {
  @IsString()
  @IsOptional()
  readonly name?: string;

  @IsString()
  readonly currentPassword!: string;
}
