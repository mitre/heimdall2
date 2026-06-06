import {createZodDto} from 'nestjs-zod';
import {createEvaluationSchema} from './create-evaluation.schema';

export class CreateEvaluationDto extends createZodDto(createEvaluationSchema) {}
