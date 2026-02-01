import { z } from 'zod';

export const updateSubscriptionSchema = z.object({
  service_ids: z.array(z.string().uuid('Invalid service ID')).default([]),
});

export type UpdateSubscriptionFormData = z.infer<typeof updateSubscriptionSchema>;
