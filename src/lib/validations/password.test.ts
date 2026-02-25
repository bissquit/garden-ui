import { describe, it, expect } from 'vitest';
import { changePasswordSchema } from './password';

describe('changePasswordSchema', () => {
  it('accepts valid input', () => {
    const result = changePasswordSchema.safeParse({
      current_password: 'oldpassword',
      new_password: 'newpassword123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty current_password', () => {
    const result = changePasswordSchema.safeParse({
      current_password: '',
      new_password: 'newpassword123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Current password is required');
    }
  });

  it('rejects empty new_password', () => {
    const result = changePasswordSchema.safeParse({
      current_password: 'oldpassword',
      new_password: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'New password must be at least 8 characters'
      );
    }
  });

  it('rejects new_password shorter than 8 characters', () => {
    const result = changePasswordSchema.safeParse({
      current_password: 'oldpassword',
      new_password: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'New password must be at least 8 characters'
      );
    }
  });

  it('rejects when new_password equals current_password', () => {
    const result = changePasswordSchema.safeParse({
      current_password: 'samepassword',
      new_password: 'samepassword',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'New password must be different from current password'
      );
    }
  });

  it('accepts new_password with exactly 8 characters', () => {
    const result = changePasswordSchema.safeParse({
      current_password: 'oldpassword',
      new_password: '12345678',
    });
    expect(result.success).toBe(true);
  });
});
