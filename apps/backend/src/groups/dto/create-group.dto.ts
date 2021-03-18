import {ICreateGroup} from '@heimdall/interfaces';
import {IsBoolean, IsNotEmpty, IsOptional, IsString} from 'class-validator';

export class CreateGroupDto implements ICreateGroup {
  @IsNotEmpty()
  @IsString()
  readonly name!: string;

  @IsOptional()
  @IsBoolean()
  readonly public!: boolean;
}
