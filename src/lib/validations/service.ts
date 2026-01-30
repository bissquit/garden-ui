import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const serviceStatusEnum = z.enum([
  'operational',
  'degraded',
  'partial_outage',
  'major_outage',
  'maintenance',
]);

export const createServiceSchema = z.object({
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
  status: serviceStatusEnum.optional(),
  group_ids: z.array(z.string().uuid()).optional().default([]),
  order: z.number().int().default(0),
});

export const updateServiceSchema = z.object({
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
  status: serviceStatusEnum,
  group_ids: z.array(z.string().uuid()).optional().default([]),
  order: z.number().int().optional(),
});

export type CreateServiceFormData = z.infer<typeof createServiceSchema>;
export type UpdateServiceFormData = z.infer<typeof updateServiceSchema>;
