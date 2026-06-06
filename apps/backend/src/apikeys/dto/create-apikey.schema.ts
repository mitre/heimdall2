import {z} from 'zod';

export const createApiKeySchema = z.object({
  userId: z.string().optional(),
  groupId: z.string().optional(),
  userEmail: z.string().optional(),
  name: z.string().optional(),
  currentPassword: z.string().optional(),
});
