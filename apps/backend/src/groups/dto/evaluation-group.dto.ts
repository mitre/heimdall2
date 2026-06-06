import {createZodDto} from 'nestjs-zod';
import {evaluationGroupSchema} from './evaluation-group.schema';

export class EvaluationGroupDto extends createZodDto(evaluationGroupSchema) {}
