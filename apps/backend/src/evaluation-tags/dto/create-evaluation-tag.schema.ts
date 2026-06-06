import {z} from 'zod';

export const CreateEvaluationTagSchema = z.object({
  value: z.string().min(1),
});

export type CreateEvaluationTagInput = z.infer<typeof CreateEvaluationTagSchema>;
