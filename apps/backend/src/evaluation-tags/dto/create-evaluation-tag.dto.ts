import {createZodDto} from 'nestjs-zod';
import {CreateEvaluationTagSchema} from './create-evaluation-tag.schema';

export class CreateEvaluationTagDto extends createZodDto(CreateEvaluationTagSchema) {}
