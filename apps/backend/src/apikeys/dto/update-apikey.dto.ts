import { IUpdateAPIKey } from '@heimdall/common/interfaces';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAPIKeyDto implements IUpdateAPIKey {
  @IsString()
  @IsOptional()
  readonly currentPassword!: string;

  @IsString()
  readonly name!: string;
}
