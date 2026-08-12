import { IUpdateEvaluation } from '@heimdall/common/interfaces';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateEvaluationDto implements IUpdateEvaluation {
  @IsOptional()
  @IsObject()
  readonly data: Record<string, unknown> | undefined;

  @IsOptional()
  @IsString()
  readonly filename: string | undefined;

  @IsOptional()
  @IsBoolean()
  readonly public: boolean | undefined;
}
