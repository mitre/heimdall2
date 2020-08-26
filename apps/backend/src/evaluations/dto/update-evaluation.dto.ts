import {IsOptional} from 'class-validator';
import {UpdateEvaluationTagDto} from '../../evaluation-tags/dto/update-evaluation-tag.dto';
import {
  IUpdateEvaluation,
  ICreateEvaluationTagDto,
  IDeleteEvaluationTagDto
} from '@heimdall/interfaces';

export class UpdateEvaluationDto implements IUpdateEvaluation {
  @IsOptional()
  readonly version: string;

  @IsOptional()
  readonly data: Record<string, any>;

  @IsOptional()
  readonly evaluationTags: (UpdateEvaluationTagDto|ICreateEvaluationTagDto|IDeleteEvaluationTagDto)[];
}
