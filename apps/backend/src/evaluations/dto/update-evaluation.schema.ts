import {z} from 'zod';

export const updateEvaluationSchema = z.object({
  filename: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  public: z.boolean().optional(),
});
