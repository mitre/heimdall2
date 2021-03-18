import {ICreateEvaluation} from '@heimdall/interfaces';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString
} from 'class-validator';
import {CreateEvaluationTagDto} from '../../evaluation-tags/dto/create-evaluation-tag.dto';

export class CreateEvaluationDto implements ICreateEvaluation {
  @IsNotEmpty()
  @IsString()
  readonly filename!: string;

  @IsNotEmpty()
  @IsBoolean()
  readonly public!: boolean;

  @IsOptional()
  @IsArray()
  readonly evaluationTags: CreateEvaluationTagDto[] | undefined;
}
