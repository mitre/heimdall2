import {IUpdateEvaluation} from '@heimdall/interfaces';
import {IsObject, IsOptional, IsString} from 'class-validator';

export class UpdateEvaluationDto implements IUpdateEvaluation {
  @IsOptional()
  @IsString()
  readonly filename: string | undefined;

  @IsOptional()
  readonly groups: string[] | undefined;

  @IsOptional()
  @IsObject()
  readonly data: Record<string, any> | undefined;
}
