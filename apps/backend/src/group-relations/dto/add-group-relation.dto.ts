import {IAddGroupRelation} from '@heimdall/interfaces';
import {IsNotEmpty, IsString} from 'class-validator';

export class AddGroupRelationDto implements IAddGroupRelation {
  @IsNotEmpty()
  @IsString()
  readonly parentId!: string;

  @IsNotEmpty()
  @IsString()
  readonly childId!: string;
}
