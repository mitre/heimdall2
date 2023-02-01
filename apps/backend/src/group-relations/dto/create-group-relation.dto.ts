import { ICreateGroupRelation } from '@heimdall/interfaces/group-relations/create-group-relation.interface';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGroupRelationDto implements ICreateGroupRelation {
  @IsNotEmpty()
  @IsString()
  readonly parentId!: string;

  @IsNotEmpty()
  @IsString()
  readonly childId!: string;
}
