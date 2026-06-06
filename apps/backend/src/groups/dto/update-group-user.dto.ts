import {createZodDto} from 'nestjs-zod';
import {updateGroupUserRoleSchema} from './update-group-user.schema';

export class UpdateGroupUserRoleDto extends createZodDto(updateGroupUserRoleSchema) {}
