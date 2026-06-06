import {createZodDto} from 'nestjs-zod';
import {updateEvaluationSchema} from './update-evaluation.schema';

export class UpdateEvaluationDto extends createZodDto(updateEvaluationSchema) {}
