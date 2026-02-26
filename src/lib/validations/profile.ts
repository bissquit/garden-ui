import { z } from 'zod';

export const updateProfileSchema = z.object({
  first_name: z.string().max(100, 'First name must be at most 100 characters').optional(),
  last_name: z.string().max(100, 'Last name must be at most 100 characters').optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
