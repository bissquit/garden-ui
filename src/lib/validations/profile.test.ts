import { describe, it, expect } from 'vitest';
import { updateProfileSchema } from './profile';

describe('updateProfileSchema', () => {
  it('accepts valid input with both fields', () => {
    const result = updateProfileSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all fields optional)', () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts only first_name', () => {
    const result = updateProfileSchema.safeParse({
      first_name: 'John',
    });
    expect(result.success).toBe(true);
  });

  it('accepts only last_name', () => {
    const result = updateProfileSchema.safeParse({
      last_name: 'Doe',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty strings', () => {
    const result = updateProfileSchema.safeParse({
      first_name: '',
      last_name: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects first_name exceeding 100 characters', () => {
    const result = updateProfileSchema.safeParse({
      first_name: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'First name must be at most 100 characters'
      );
    }
  });

  it('rejects last_name exceeding 100 characters', () => {
    const result = updateProfileSchema.safeParse({
      last_name: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Last name must be at most 100 characters'
      );
    }
  });

  it('accepts first_name with exactly 100 characters', () => {
    const result = updateProfileSchema.safeParse({
      first_name: 'a'.repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it('accepts last_name with exactly 100 characters', () => {
    const result = updateProfileSchema.safeParse({
      last_name: 'a'.repeat(100),
    });
    expect(result.success).toBe(true);
  });
});
