import {IsNotEmpty, IsString} from 'class-validator';
import {ICreateEvaluationTag} from '@heimdall/interfaces';

export class CreateEvaluationTagDto implements ICreateEvaluationTag {
  @IsNotEmpty()
  @IsString()
  readonly key!: string;

  @IsNotEmpty()
  @IsString()
  readonly value!: string;

  constructor(dto: CreateEvaluationTagDto) {
    this.key = dto.key;
    this.value = dto.value;
  }
}
