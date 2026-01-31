import { describe, it, expect } from 'vitest';
import { createTemplateSchema } from './template';

describe('createTemplateSchema', () => {
  it('validates correct data', () => {
    const result = createTemplateSchema.safeParse({
      slug: 'database-maintenance',
      type: 'maintenance',
      title_template: 'Database Maintenance',
      body_template: 'Scheduled database maintenance.',
    });
    expect(result.success).toBe(true);
  });

  it('validates incident type', () => {
    const result = createTemplateSchema.safeParse({
      slug: 'api-outage',
      type: 'incident',
      title_template: 'API Outage',
      body_template: 'API service is experiencing issues.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty slug', () => {
    const result = createTemplateSchema.safeParse({
      slug: '',
      type: 'incident',
      title_template: 'Test',
      body_template: 'Test body',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Slug is required');
    }
  });

  it('rejects invalid slug format - uppercase', () => {
    const result = createTemplateSchema.safeParse({
      slug: 'Invalid-Slug',
      type: 'incident',
      title_template: 'Test',
      body_template: 'Test body',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Slug must contain only lowercase letters, numbers, and hyphens'
      );
    }
  });

  it('rejects invalid slug format - spaces', () => {
    const result = createTemplateSchema.safeParse({
      slug: 'invalid slug',
      type: 'incident',
      title_template: 'Test',
      body_template: 'Test body',
    });
    expect(result.success).toBe(false);
  });

  it('accepts slug with numbers', () => {
    const result = createTemplateSchema.safeParse({
      slug: 'api-v2-maintenance',
      type: 'maintenance',
      title_template: 'API V2 Maintenance',
      body_template: 'Maintenance for API v2.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = createTemplateSchema.safeParse({
      slug: 'test',
      type: 'invalid',
      title_template: 'Test',
      body_template: 'Test body',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty title_template', () => {
    const result = createTemplateSchema.safeParse({
      slug: 'test',
      type: 'incident',
      title_template: '',
      body_template: 'Test body',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Title template is required');
    }
  });

  it('rejects empty body_template', () => {
    const result = createTemplateSchema.safeParse({
      slug: 'test',
      type: 'incident',
      title_template: 'Test',
      body_template: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Body template is required');
    }
  });

  it('rejects missing fields', () => {
    const result = createTemplateSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});
