import {IRegenerateAPIKey} from '@heimdall/interfaces';
import {IsString} from 'class-validator';

export class RegenerateAPIKeyDto implements IRegenerateAPIKey {
  @IsString()
  readonly currentPassword!: string;
}
