import {IRegenerateAPIKey} from '@heimdall/interfaces';
import {IsOptional, IsString} from 'class-validator';

export class RegenerateAPIKeyDto implements IRegenerateAPIKey {
  @IsOptional()
  @IsString()
  readonly currentPassword!: string;
}
