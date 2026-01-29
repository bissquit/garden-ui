import { describe, it, expect } from 'vitest';
import { createServiceSchema, updateServiceSchema } from './service';

describe('createServiceSchema', () => {
  it('should validate a valid service', () => {
    const validService = {
      name: 'My Service',
      slug: 'my-service',
      order: 0,
    };

    const result = createServiceSchema.safeParse(validService);
    expect(result.success).toBe(true);
  });

  it('should reject invalid slug format', () => {
    const invalidService = {
      name: 'My Service',
      slug: 'My Service', // spaces not allowed
      order: 0,
    };

    const result = createServiceSchema.safeParse(invalidService);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toEqual(['slug']);
    }
  });

  it('should reject empty name', () => {
    const invalidService = {
      name: '',
      slug: 'my-service',
      order: 0,
    };

    const result = createServiceSchema.safeParse(invalidService);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toEqual(['name']);
    }
  });

  it('should accept optional fields', () => {
    const serviceWithOptionals = {
      name: 'My Service',
      slug: 'my-service',
      description: 'Test description',
      status: 'operational' as const,
      group_id: '123e4567-e89b-12d3-a456-426614174000',
      order: 1,
    };

    const result = createServiceSchema.safeParse(serviceWithOptionals);
    expect(result.success).toBe(true);
  });

  it('should apply default order value', () => {
    const service = {
      name: 'My Service',
      slug: 'my-service',
    };

    const result = createServiceSchema.safeParse(service);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order).toBe(0);
    }
  });
});

describe('updateServiceSchema', () => {
  it('should validate a valid service update', () => {
    const validUpdate = {
      name: 'Updated Service',
      slug: 'updated-service',
      status: 'operational' as const,
    };

    const result = updateServiceSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should require status for updates', () => {
    const invalidUpdate = {
      name: 'Updated Service',
      slug: 'updated-service',
      // status missing
    };

    const result = updateServiceSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
  });
});
