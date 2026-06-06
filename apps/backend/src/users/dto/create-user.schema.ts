import {z} from 'zod';
import env from '../../env';

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(env.PASSWORD_MIN_LENGTH),
  passwordConfirmation: z.string().min(env.PASSWORD_MIN_LENGTH),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organization: z.string().optional(),
  title: z.string().optional(),
  role: z.enum(['user']),
  creationMethod: z.enum([
    'local',
    'ldap',
    'github',
    'gitlab',
    'google',
    'okta',
    'oidc',
  ]),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
