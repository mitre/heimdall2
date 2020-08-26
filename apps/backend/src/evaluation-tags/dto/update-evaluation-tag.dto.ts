import {
  IsOptional,
  IsString,
  IsNumber
} from 'class-validator';
import {IUpdateEvaluationTag} from '@heimdall/interfaces';

export class UpdateEvaluationTagDto implements IUpdateEvaluationTag {
  @IsNumber()
  readonly id: number

  @IsOptional()
  @IsString()
  readonly key: string;

  @IsOptional()
  @IsString()
  readonly value: string;

  constructor(dto) {
    this.id = dto.id;
    this.key = dto.key;
    this.value = dto.value;
  }
}
