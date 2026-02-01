import { z } from 'zod';

export const channelTypeEnum = z.enum(['email', 'telegram']);

export const createChannelSchema = z
  .object({
    type: channelTypeEnum,
    target: z.string().min(1, 'Target is required'),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.target)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter a valid email address',
          path: ['target'],
        });
      }
    } else if (data.type === 'telegram') {
      // Telegram username: 5-32 characters, alphanumeric and underscores
      const telegramRegex = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
      if (!telegramRegex.test(data.target)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter a valid Telegram username (5-32 characters, letters, numbers, underscores)',
          path: ['target'],
        });
      }
    }
  });

export type CreateChannelFormData = z.infer<typeof createChannelSchema>;
