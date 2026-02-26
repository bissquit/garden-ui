import { describe, it, expect } from 'vitest';
import { changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from './password';

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

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects empty email', () => {
    const result = forgotPasswordSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Email is required');
    }
  });

  it('rejects invalid email format', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Please enter a valid email address');
    }
  });
});

describe('resetPasswordSchema', () => {
  it('accepts valid matching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      new_password: 'newpass123',
      confirm_password: 'newpass123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short password', () => {
    const result = resetPasswordSchema.safeParse({
      new_password: 'short',
      confirm_password: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Password must be at least 8 characters'
      );
    }
  });

  it('rejects non-matching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      new_password: 'newpass123',
      confirm_password: 'different1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Passwords do not match');
    }
  });

  it('rejects empty confirm_password', () => {
    const result = resetPasswordSchema.safeParse({
      new_password: 'newpass123',
      confirm_password: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Please confirm your password');
    }
  });
});
