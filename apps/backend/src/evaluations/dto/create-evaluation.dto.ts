import {ICreateEvaluation} from '@heimdall/interfaces';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString
} from 'class-validator';
import {CreateEvaluationTagDto} from '../../evaluation-tags/dto/create-evaluation-tag.dto';

export class CreateEvaluationDto implements ICreateEvaluation {
  @IsNotEmpty()
  @IsString()
  readonly filename!: string;

  @IsNotEmpty()
  @IsObject()
  readonly data!: Record<string, any>;

  @IsOptional()
  @IsArray()
  readonly evaluationTags: CreateEvaluationTagDto[] | undefined;
}
