import {createZodDto} from 'nestjs-zod';
import {DeleteUserSchema} from './delete-user.schema';

export class DeleteUserDto extends createZodDto(DeleteUserSchema) {}
