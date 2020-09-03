import {IsOptional} from 'class-validator';
import {IUpdateEvaluationTag} from '@heimdall/interfaces';

export class UpdateEvaluationTagDto implements IUpdateEvaluationTag {
  @IsOptional()
  readonly key: string;

  @IsOptional()
  readonly value: string;
}
