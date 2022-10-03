import {ICreateEvaluation} from '@heimdall/interfaces';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString
} from 'class-validator';
import {CreateEvaluationTagDto} from '../../evaluation-tags/dto/create-evaluation-tag.dto';

export class CreateEvaluationDto implements ICreateEvaluation {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({description: 'The filename that will appear within the frontend database tab'})
  readonly filename!: string;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty({description: 'If this evaluation is visible to all users. If false, only the original uploader and the groups associated with the file will have access'})
  readonly public!: boolean;

  @IsOptional()
  @IsArray()
  @ApiProperty({description: 'Strings associated with this file, if the tags are known, they will be created', example: ['rhel', 'database', 'baseline']})
  readonly evaluationTags: CreateEvaluationTagDto[] | undefined;

  @IsOptional()
  @IsArray()
  @ApiProperty({description: 'The groups that will have access to this file', example: ['SAF', 'Security']})
  readonly groups: string[] | undefined;
}
