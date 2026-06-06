import {createZodDto} from 'nestjs-zod';
import {deleteApiKeySchema} from './delete-apikey.schema';

export class DeleteAPIKeyDto extends createZodDto(deleteApiKeySchema) {}
