import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createTemplateSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(slugPattern, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  type: z.enum(['incident', 'maintenance']),
  title_template: z.string().min(1, 'Title template is required'),
  body_template: z.string().min(1, 'Body template is required'),
});

export type CreateTemplateFormData = z.infer<typeof createTemplateSchema>;
