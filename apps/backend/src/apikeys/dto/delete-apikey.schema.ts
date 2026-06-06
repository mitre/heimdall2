import {z} from 'zod';

export const deleteApiKeySchema = z.object({
  currentPassword: z.string().optional(),
});
