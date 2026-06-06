import {createZodDto} from 'nestjs-zod';
import {createGroupSchema} from './create-group.schema';

export class CreateGroupDto extends createZodDto(createGroupSchema) {}
