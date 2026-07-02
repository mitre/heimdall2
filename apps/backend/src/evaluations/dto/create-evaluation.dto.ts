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
  @IsArray()
  @IsOptional()
  readonly evaluationTags: CreateEvaluationTagDto[] | undefined;

  @IsNotEmpty()
  @IsString()
  readonly filename!: string;

  @IsArray()
  @IsOptional()
  readonly groups: string[] | undefined;

  @IsBoolean()
  @IsNotEmpty()
  readonly public!: boolean;
}
