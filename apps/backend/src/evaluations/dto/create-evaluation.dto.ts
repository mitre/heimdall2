import {ICreateEvaluation} from '@heimdall/interfaces';
import {IsArray, IsIn, IsNotEmpty, IsOptional, IsString} from 'class-validator';
import {CreateEvaluationTagDto} from '../../evaluation-tags/dto/create-evaluation-tag.dto';

export class CreateEvaluationDto implements ICreateEvaluation {
  @IsNotEmpty()
  @IsString()
  readonly filename!: string;

  readonly data!: Record<string, any>;

  @IsNotEmpty()
  @IsIn([true, false, 'true', 'false'])
  public!: boolean | string;

  @IsOptional()
  @IsArray()
  readonly evaluationTags: CreateEvaluationTagDto[] | undefined;
}
