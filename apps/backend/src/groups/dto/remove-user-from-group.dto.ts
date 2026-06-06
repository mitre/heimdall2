import {createZodDto} from 'nestjs-zod';
import {removeUserFromGroupSchema} from './remove-user-from-group.schema';

export class RemoveUserFromGroupDto extends createZodDto(removeUserFromGroupSchema) {}
