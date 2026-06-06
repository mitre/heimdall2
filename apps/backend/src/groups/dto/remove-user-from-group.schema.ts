import {z} from 'zod';

export const removeUserFromGroupSchema = z.object({
  userId: z.string().min(1),
});
