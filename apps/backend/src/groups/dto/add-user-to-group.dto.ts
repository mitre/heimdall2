import {createZodDto} from 'nestjs-zod';
import {addUserToGroupSchema} from './add-user-to-group.schema';

export class AddUserToGroupDto extends createZodDto(addUserToGroupSchema) {}
