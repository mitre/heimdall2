import { ICreateEvaluation } from '@heimdall/common/interfaces';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateEvaluationTagDto } from '../../evaluation-tags/dto/create-evaluation-tag.dto';

export class CreateEvaluationDto implements ICreateEvaluation {
  @IsOptional()
  @IsArray()
  readonly evaluationTags: CreateEvaluationTagDto[] | undefined;

  @IsNotEmpty()
  @IsString()
  readonly filename!: string;

  @IsOptional()
  @IsArray()
  readonly groups: string[] | undefined;

  @IsNotEmpty()
  @IsBoolean()
  readonly public!: boolean;
}
