import {z} from 'zod';

export const createEvaluationSchema = z.object({
  filename: z.string().min(1),
  public: z.boolean(),
  evaluationTags: z.array(z.object({value: z.string()})).optional(),
  groups: z.array(z.string()).optional(),
});
