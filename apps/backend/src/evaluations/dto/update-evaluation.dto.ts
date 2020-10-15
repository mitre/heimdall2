import {IsOptional, IsString, IsObject} from 'class-validator';
import {IUpdateEvaluation} from '@heimdall/interfaces';

export class UpdateEvaluationDto implements IUpdateEvaluation {
  @IsOptional()
  @IsString()
  readonly filename: string | undefined;

  @IsOptional()
  @IsObject()
  readonly data: Record<string, any> | undefined;
}
