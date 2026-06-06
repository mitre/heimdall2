import {z} from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1),
  public: z.boolean().optional(),
  desc: z.string().optional(),
});
