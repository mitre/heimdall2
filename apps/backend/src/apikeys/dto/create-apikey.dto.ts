import {createZodDto} from 'nestjs-zod';
import {createApiKeySchema} from './create-apikey.schema';

export class CreateApiKeyDto extends createZodDto(createApiKeySchema) {}
