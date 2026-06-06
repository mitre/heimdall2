import {createZodDto} from 'nestjs-zod';
import {updateApiKeySchema} from './update-apikey.schema';

export class UpdateAPIKeyDto extends createZodDto(updateApiKeySchema) {}
