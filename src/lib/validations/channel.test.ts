import { describe, it, expect } from 'vitest';
import { createChannelSchema, verifyChannelSchema } from './channel';

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

  describe('mattermost type', () => {
    it('accepts valid https webhook URL', () => {
      const result = createChannelSchema.safeParse({
        type: 'mattermost',
        target: 'https://mattermost.example.com/hooks/abc123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects http webhook URL', () => {
      const result = createChannelSchema.safeParse({
        type: 'mattermost',
        target: 'http://mattermost.example.com/hooks/abc123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('HTTPS');
      }
    });

    it('rejects non-URL target', () => {
      const result = createChannelSchema.safeParse({
        type: 'mattermost',
        target: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty target', () => {
      const result = createChannelSchema.safeParse({
        type: 'mattermost',
        target: '',
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

describe('verifyChannelSchema', () => {
  it('accepts valid 6-digit code', () => {
    const result = verifyChannelSchema.safeParse({ code: '123456' });
    expect(result.success).toBe(true);
  });

  it('rejects code with less than 6 digits', () => {
    const result = verifyChannelSchema.safeParse({ code: '12345' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Code must be 6 digits');
    }
  });

  it('rejects code with more than 6 digits', () => {
    const result = verifyChannelSchema.safeParse({ code: '1234567' });
    expect(result.success).toBe(false);
  });

  it('rejects code with non-digit characters', () => {
    const result = verifyChannelSchema.safeParse({ code: '12345a' });
    expect(result.success).toBe(false);
  });

  it('rejects empty code', () => {
    const result = verifyChannelSchema.safeParse({ code: '' });
    expect(result.success).toBe(false);
  });
});
