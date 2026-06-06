import {z} from 'zod';

export const evaluationGroupSchema = z.object({
  id: z.string().min(1),
});
