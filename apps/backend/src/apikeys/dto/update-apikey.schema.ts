import {z} from 'zod';

export const updateApiKeySchema = z.object({
  name: z.string(),
  currentPassword: z.string().optional(),
});
