import { describe, it, expect } from 'vitest';
import { setChannelSubscriptionsSchema } from './subscription';

describe('setChannelSubscriptionsSchema', () => {
  it('accepts subscribe_to_all_services=true with empty service_ids', () => {
    const result = setChannelSubscriptionsSchema.safeParse({
      subscribe_to_all_services: true,
      service_ids: [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts subscribe_to_all_services=false with service_ids', () => {
    const result = setChannelSubscriptionsSchema.safeParse({
      subscribe_to_all_services: false,
      service_ids: ['550e8400-e29b-41d4-a716-446655440000'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects subscribe_to_all_services=true with service_ids', () => {
    const result = setChannelSubscriptionsSchema.safeParse({
      subscribe_to_all_services: true,
      service_ids: ['550e8400-e29b-41d4-a716-446655440000'],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Cannot specify service_ids when subscribe_to_all_services is true'
      );
    }
  });

  it('accepts subscribe_to_all_services=false with empty service_ids (unsubscribed)', () => {
    const result = setChannelSubscriptionsSchema.safeParse({
      subscribe_to_all_services: false,
      service_ids: [],
    });
    expect(result.success).toBe(true);
  });

  it('defaults subscribe_to_all_services to false', () => {
    const result = setChannelSubscriptionsSchema.safeParse({
      service_ids: ['550e8400-e29b-41d4-a716-446655440000'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subscribe_to_all_services).toBe(false);
    }
  });

  it('defaults service_ids to empty array', () => {
    const result = setChannelSubscriptionsSchema.safeParse({
      subscribe_to_all_services: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.service_ids).toEqual([]);
    }
  });

  it('defaults both fields when empty object provided', () => {
    const result = setChannelSubscriptionsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subscribe_to_all_services).toBe(false);
      expect(result.data.service_ids).toEqual([]);
    }
  });

  it('rejects invalid uuid in service_ids', () => {
    const result = setChannelSubscriptionsSchema.safeParse({
      subscribe_to_all_services: false,
      service_ids: ['not-a-uuid'],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid service ID');
    }
  });

  it('accepts multiple valid uuids in service_ids', () => {
    const result = setChannelSubscriptionsSchema.safeParse({
      subscribe_to_all_services: false,
      service_ids: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
      ],
    });
    expect(result.success).toBe(true);
  });
});
