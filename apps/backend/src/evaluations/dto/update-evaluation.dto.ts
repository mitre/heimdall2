import {IsOptional, IsArray, IsString, IsObject} from 'class-validator';
import {IUpdateEvaluation} from '@heimdall/interfaces';
import {UpdateEvaluationTagDto} from '../../evaluation-tags/dto/update-evaluation-tag.dto';
import {CreateEvaluationTagDto} from '../../evaluation-tags/dto/create-evaluation-tag.dto';
import {DeleteEvaluationTagDto} from '../../evaluation-tags/dto/delete-evaluation-tag.dto';

export class UpdateEvaluationDto implements IUpdateEvaluation {
  @IsOptional()
  @IsString()
  readonly filename: string;

  @IsOptional()
  @IsObject()
  readonly data: Record<string, any>;

  @IsOptional()
  @IsArray()
  readonly evaluationTags: (
    | UpdateEvaluationTagDto
    | CreateEvaluationTagDto
    | DeleteEvaluationTagDto
  )[];
}
