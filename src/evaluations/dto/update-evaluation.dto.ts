import {IsOptional} from 'class-validator';
import {UpdateEvaluationTagDto} from '../../evaluation-tags/dto/update-evaluation-tag.dto';

export class UpdateEvaluationDto {
  @IsOptional()
  readonly version: string;

  @IsOptional()
  readonly data: Record<string, any>;

  @IsOptional()
  readonly evaluationTags: UpdateEvaluationTagDto[];
}
