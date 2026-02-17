import { z } from 'zod';

export const setChannelSubscriptionsSchema = z
  .object({
    subscribe_to_all_services: z.boolean().default(false),
    service_ids: z.array(z.string().uuid('Invalid service ID')).default([]),
  })
  .refine((data) => !data.subscribe_to_all_services || data.service_ids.length === 0, {
    message: 'Cannot specify service_ids when subscribe_to_all_services is true',
    path: ['service_ids'],
  });

export type SetChannelSubscriptionsInput = z.infer<typeof setChannelSubscriptionsSchema>;
