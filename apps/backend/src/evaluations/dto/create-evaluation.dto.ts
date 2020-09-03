import {IsNotEmpty, IsOptional} from 'class-validator';
import {CreateEvaluationTagDto} from '../../evaluation-tags/dto/create-evaluation-tag.dto';
import {ICreateEvaluation} from '@heimdall/interfaces';

export class CreateEvaluationDto implements ICreateEvaluation {
  @IsNotEmpty()
  readonly version: string;

  @IsNotEmpty()
  readonly data: Record<string, any>;

  @IsOptional()
  readonly evaluationTags: CreateEvaluationTagDto[];
}
