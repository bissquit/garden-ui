import { describe, it, expect } from 'vitest';
import { createGroupSchema, updateGroupSchema } from './group';

describe('createGroupSchema', () => {
  it('validates correct data', () => {
    const result = createGroupSchema.safeParse({
      name: 'Core Services',
      slug: 'core-services',
      description: 'Core infrastructure services',
      order: 1,
    });
    expect(result.success).toBe(true);
  });

  it('validates data with optional fields omitted', () => {
    const result = createGroupSchema.safeParse({
      name: 'API Services',
      slug: 'api-services',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order).toBe(0);
    }
  });

  it('rejects empty name', () => {
    const result = createGroupSchema.safeParse({
      name: '',
      slug: 'test-group',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Name is required');
    }
  });

  it('rejects name over 255 characters', () => {
    const result = createGroupSchema.safeParse({
      name: 'a'.repeat(256),
      slug: 'test-group',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Name must be less than 255 characters');
    }
  });

  it('rejects empty slug', () => {
    const result = createGroupSchema.safeParse({
      name: 'Test Group',
      slug: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Slug is required');
    }
  });

  it('rejects invalid slug format - uppercase', () => {
    const result = createGroupSchema.safeParse({
      name: 'Test Group',
      slug: 'Invalid-Slug',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Slug must contain only lowercase letters, numbers, and hyphens'
      );
    }
  });

  it('rejects invalid slug format - spaces', () => {
    const result = createGroupSchema.safeParse({
      name: 'Test Group',
      slug: 'invalid slug',
    });
    expect(result.success).toBe(false);
  });

  it('accepts slug with numbers', () => {
    const result = createGroupSchema.safeParse({
      name: 'API V2',
      slug: 'api-v2-services',
    });
    expect(result.success).toBe(true);
  });
});

describe('updateGroupSchema', () => {
  it('validates correct data', () => {
    const result = updateGroupSchema.safeParse({
      name: 'Updated Group',
      slug: 'updated-group',
      order: 5,
    });
    expect(result.success).toBe(true);
  });
});
