import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255, 'Slug must be less than 255 characters')
    .regex(slugPattern, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  order: z.number().int().default(0),
});

export const updateGroupSchema = createGroupSchema;

export type CreateGroupFormData = z.infer<typeof createGroupSchema>;
export type UpdateGroupFormData = z.infer<typeof updateGroupSchema>;
