import {IUpdateEvaluation} from '@heimdall/interfaces';
import {IsBoolean, IsObject, IsOptional, IsString} from 'class-validator';

export class UpdateEvaluationDto implements IUpdateEvaluation {
  @IsOptional()
  @IsString()
  readonly filename: string | undefined;

  @IsOptional()
  @IsObject()
  readonly data: Record<string, any> | undefined;

  @IsOptional()
  @IsBoolean()
  readonly public: boolean | undefined;
}
