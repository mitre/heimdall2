import {z} from 'zod';

export const updateGroupUserRoleSchema = z.object({
  userId: z.string().min(1),
  groupRole: z.enum(['owner', 'member']),
});
