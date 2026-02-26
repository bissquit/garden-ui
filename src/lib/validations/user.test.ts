import { describe, it, expect } from 'vitest';
import { createUserSchema, updateUserSchema, adminResetPasswordSchema } from './user';

describe('createUserSchema', () => {
  it('accepts valid input with all fields', () => {
    const result = createUserSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      first_name: 'John',
      last_name: 'Doe',
      role: 'operator',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid input with only required fields', () => {
    const result = createUserSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      role: 'user',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty string for first_name and last_name', () => {
    const result = createUserSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      first_name: '',
      last_name: '',
      role: 'admin',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty email', () => {
    const result = createUserSchema.safeParse({
      email: '',
      password: 'password123',
      role: 'user',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Email is required');
    }
  });

  it('rejects invalid email format', () => {
    const result = createUserSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
      role: 'user',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Please enter a valid email address');
    }
  });

  it('rejects password shorter than 8 characters', () => {
    const result = createUserSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
      role: 'user',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
    }
  });

  it('accepts password with exactly 8 characters', () => {
    const result = createUserSchema.safeParse({
      email: 'user@example.com',
      password: '12345678',
      role: 'user',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid role', () => {
    const result = createUserSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      role: 'superadmin',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing role', () => {
    const result = createUserSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects first_name longer than 100 characters', () => {
    const result = createUserSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      first_name: 'a'.repeat(101),
      role: 'user',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  it('accepts valid input with all fields', () => {
    const result = updateUserSchema.safeParse({
      first_name: 'Jane',
      last_name: 'Smith',
      role: 'admin',
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateUserSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only role', () => {
    const result = updateUserSchema.safeParse({
      role: 'operator',
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only is_active', () => {
    const result = updateUserSchema.safeParse({
      is_active: false,
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty string for first_name', () => {
    const result = updateUserSchema.safeParse({
      first_name: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid role', () => {
    const result = updateUserSchema.safeParse({
      role: 'superadmin',
    });
    expect(result.success).toBe(false);
  });

  it('rejects last_name longer than 100 characters', () => {
    const result = updateUserSchema.safeParse({
      last_name: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe('adminResetPasswordSchema', () => {
  it('accepts valid password', () => {
    const result = adminResetPasswordSchema.safeParse({
      new_password: 'newpassword123',
    });
    expect(result.success).toBe(true);
  });

  it('accepts password with exactly 8 characters', () => {
    const result = adminResetPasswordSchema.safeParse({
      new_password: '12345678',
    });
    expect(result.success).toBe(true);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = adminResetPasswordSchema.safeParse({
      new_password: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
    }
  });

  it('rejects empty password', () => {
    const result = adminResetPasswordSchema.safeParse({
      new_password: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
    }
  });

  it('rejects missing password', () => {
    const result = adminResetPasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
