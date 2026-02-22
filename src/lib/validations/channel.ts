import { z } from 'zod';

export const channelTypeEnum = z.enum(['email', 'telegram', 'mattermost']);

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
      // Telegram: numeric chat ID or username (5-32 chars, starts with letter)
      const isNumericId = /^\d+$/.test(data.target);
      const isUsername = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(data.target);
      if (!isNumericId && !isUsername) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter a numeric chat ID or username (5-32 characters, letters, numbers, underscores)',
          path: ['target'],
        });
      }
    } else if (data.type === 'mattermost') {
      // Mattermost webhook URL must be valid HTTPS URL
      try {
        const url = new URL(data.target);
        if (url.protocol !== 'https:') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Webhook URL must use HTTPS',
            path: ['target'],
          });
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter a valid webhook URL',
          path: ['target'],
        });
      }
    }
  });

export type CreateChannelFormData = z.infer<typeof createChannelSchema>;

export const verifyChannelSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export type VerifyChannelInput = z.infer<typeof verifyChannelSchema>;
