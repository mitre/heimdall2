import {IDeleteApiKey} from '@heimdall/interfaces';
import {IsString} from 'class-validator';

export class DeleteAPIKeyDto implements IDeleteApiKey {
  @IsString()
  readonly currentPassword!: string;
}
