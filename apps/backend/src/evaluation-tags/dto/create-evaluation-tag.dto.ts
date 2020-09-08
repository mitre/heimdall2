import {IsNotEmpty} from 'class-validator';
import {ICreateEvaluationTag} from '@heimdall/interfaces';

export class CreateEvaluationTagDto implements ICreateEvaluationTag {
  @IsNotEmpty()
  readonly key: string;

  @IsNotEmpty()
  readonly value: string;
}
