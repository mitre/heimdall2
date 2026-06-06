import {createZodDto} from 'nestjs-zod';
import {CreateUserSchema} from './create-user.schema';

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
