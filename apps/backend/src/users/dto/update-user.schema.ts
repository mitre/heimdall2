import {z} from 'zod';
import env from '../../env';

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organization: z.string().optional(),
  title: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
  password: z.string().min(env.PASSWORD_MIN_LENGTH).optional(),
  passwordConfirmation: z.string().min(env.PASSWORD_MIN_LENGTH).optional(),
  forcePasswordChange: z.boolean().optional(),
  currentPassword: z.string().min(1).optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
