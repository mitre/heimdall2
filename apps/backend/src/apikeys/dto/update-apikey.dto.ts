import { IUpdateAPIKey } from '@heimdall/common/interfaces';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAPIKeyDto implements IUpdateAPIKey {
  @IsOptional()
  @IsString()
  readonly currentPassword!: string;

  @IsString()
  readonly name!: string;
}
