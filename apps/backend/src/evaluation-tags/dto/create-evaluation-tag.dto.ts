import {ICreateEvaluationTag} from '@heimdall/interfaces';
import {IsNotEmpty, IsString} from 'class-validator';

export class CreateEvaluationTagDto implements ICreateEvaluationTag {
  @IsNotEmpty()
  @IsString()
  readonly value!: string;
}
