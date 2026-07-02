import { ICreateGroup } from '@heimdall/common/interfaces';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto implements ICreateGroup {
  @IsOptional()
  @IsString()
  readonly desc!: string;

  @IsNotEmpty()
  @IsString()
  readonly name!: string;

  @IsBoolean()
  @IsOptional()
  readonly public!: boolean;
}
