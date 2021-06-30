import {IDeleteApiKey} from '@heimdall/interfaces';
import {IsOptional, IsString} from 'class-validator';

export class DeleteAPIKeyDto implements IDeleteApiKey {
  @IsOptional()
  @IsString()
  readonly currentPassword!: string;
}
