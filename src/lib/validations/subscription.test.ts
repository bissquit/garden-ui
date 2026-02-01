import { describe, it, expect } from 'vitest';
import { updateSubscriptionSchema } from './subscription';

describe('updateSubscriptionSchema', () => {
  it('accepts valid service_ids array', () => {
    const result = updateSubscriptionSchema.safeParse({
      service_ids: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty service_ids array', () => {
    const result = updateSubscriptionSchema.safeParse({
      service_ids: [],
    });
    expect(result.success).toBe(true);
  });

  it('defaults to empty array when service_ids not provided', () => {
    const result = updateSubscriptionSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.service_ids).toEqual([]);
    }
  });

  it('rejects invalid uuid in service_ids', () => {
    const result = updateSubscriptionSchema.safeParse({
      service_ids: ['not-a-uuid'],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid service ID');
    }
  });

  it('rejects non-array service_ids', () => {
    const result = updateSubscriptionSchema.safeParse({
      service_ids: 'not-an-array',
    });
    expect(result.success).toBe(false);
  });
});
