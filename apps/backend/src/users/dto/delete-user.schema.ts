import {z} from 'zod';

export const DeleteUserSchema = z.object({
  password: z.string().min(1).optional(),
});

export type DeleteUserInput = z.infer<typeof DeleteUserSchema>;
