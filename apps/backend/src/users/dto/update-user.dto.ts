import {createZodDto} from 'nestjs-zod';
import {UpdateUserSchema} from './update-user.schema';

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
