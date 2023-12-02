import {IUpdateGroupRelation} from '@heimdall/interfaces';
import {IsNotEmpty, IsString} from 'class-validator';

export class UpdateGroupRelationDto implements IUpdateGroupRelation {
  @IsNotEmpty()
  @IsString()
  readonly parentId!: string;

  @IsNotEmpty()
  @IsString()
  readonly childId!: string;
}
