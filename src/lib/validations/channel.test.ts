import { describe, it, expect } from 'vitest';
import { createChannelSchema } from './channel';

describe('createChannelSchema', () => {
  describe('email type', () => {
    it('accepts valid email', () => {
      const result = createChannelSchema.safeParse({
        type: 'email',
        target: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = createChannelSchema.safeParse({
        type: 'email',
        target: 'invalid-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please enter a valid email address');
      }
    });

    it('rejects empty target', () => {
      const result = createChannelSchema.safeParse({
        type: 'email',
        target: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('telegram type', () => {
    it('accepts valid telegram username', () => {
      const result = createChannelSchema.safeParse({
        type: 'telegram',
        target: 'john_doe',
      });
      expect(result.success).toBe(true);
    });

    it('accepts telegram username with numbers', () => {
      const result = createChannelSchema.safeParse({
        type: 'telegram',
        target: 'user123_test',
      });
      expect(result.success).toBe(true);
    });

    it('rejects telegram username starting with number', () => {
      const result = createChannelSchema.safeParse({
        type: 'telegram',
        target: '123user',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Telegram username');
      }
    });

    it('rejects too short telegram username', () => {
      const result = createChannelSchema.safeParse({
        type: 'telegram',
        target: 'abc',
      });
      expect(result.success).toBe(false);
    });

    it('rejects telegram username with special characters', () => {
      const result = createChannelSchema.safeParse({
        type: 'telegram',
        target: 'user@name',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('invalid type', () => {
    it('rejects unknown channel type', () => {
      const result = createChannelSchema.safeParse({
        type: 'unknown',
        target: 'test',
      });
      expect(result.success).toBe(false);
    });
  });
});
