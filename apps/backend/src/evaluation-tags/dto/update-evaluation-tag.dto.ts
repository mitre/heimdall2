import {IUpdateEvaluationTag} from '@heimdall/interfaces';
import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Min
} from 'class-validator';

export class UpdateEvaluationTagDto implements IUpdateEvaluationTag {
  @IsNotEmpty()
  @IsNumberString()
  @Min(1)
  readonly id: string;

  @IsOptional()
  @IsString()
  readonly value: string;

  constructor(dto: UpdateEvaluationTagDto) {
    this.id = dto.id;
    this.value = dto.value;
  }
}
