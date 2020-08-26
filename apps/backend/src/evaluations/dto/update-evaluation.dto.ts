import {IsOptional} from 'class-validator';
import {
  IUpdateEvaluation,
  IUpdateEvaluationTagDto,
  ICreateEvaluationTagDto,
  IDeleteEvaluationTagDto
} from '@heimdall/interfaces';

export class UpdateEvaluationDto implements IUpdateEvaluation {
  @IsOptional()
  readonly version: string;

  @IsOptional()
  readonly data: Record<string, any>;

  @IsOptional()
  readonly evaluationTags: (
    | IUpdateEvaluationTagDto
    | ICreateEvaluationTagDto
    | IDeleteEvaluationTagDto
  )[];

}
