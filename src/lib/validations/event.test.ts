import { describe, it, expect } from 'vitest';
import { createEventSchema, addEventUpdateSchema } from './event';

describe('createEventSchema', () => {
  it('should validate a valid incident', () => {
    const validIncident = {
      title: 'Test Incident',
      type: 'incident' as const,
      status: 'investigating' as const,
      severity: 'minor' as const,
      description: 'Test description',
      notify_subscribers: false,
    };

    const result = createEventSchema.safeParse(validIncident);
    expect(result.success).toBe(true);
  });

  it('should validate a valid maintenance', () => {
    const validMaintenance = {
      title: 'Test Maintenance',
      type: 'maintenance' as const,
      status: 'scheduled' as const,
      description: 'Test description',
      notify_subscribers: false,
    };

    const result = createEventSchema.safeParse(validMaintenance);
    expect(result.success).toBe(true);
  });

  it('should require severity for incidents', () => {
    const invalidIncident = {
      title: 'Test Incident',
      type: 'incident' as const,
      status: 'investigating' as const,
      // severity missing
      description: 'Test description',
      notify_subscribers: false,
    };

    const result = createEventSchema.safeParse(invalidIncident);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path.includes('severity'))).toBe(true);
    }
  });

  it('should reject incident with maintenance status', () => {
    const invalidIncident = {
      title: 'Test Incident',
      type: 'incident' as const,
      status: 'scheduled' as const, // maintenance status
      severity: 'minor' as const,
      description: 'Test description',
      notify_subscribers: false,
    };

    const result = createEventSchema.safeParse(invalidIncident);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path.includes('status'))).toBe(true);
    }
  });

  it('should reject maintenance with incident status', () => {
    const invalidMaintenance = {
      title: 'Test Maintenance',
      type: 'maintenance' as const,
      status: 'investigating' as const, // incident status
      description: 'Test description',
      notify_subscribers: false,
    };

    const result = createEventSchema.safeParse(invalidMaintenance);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path.includes('status'))).toBe(true);
    }
  });

  it('should accept valid group_ids', () => {
    const eventWithGroups = {
      title: 'Test Incident',
      type: 'incident' as const,
      status: 'investigating' as const,
      severity: 'minor' as const,
      description: 'Test description',
      group_ids: ['123e4567-e89b-12d3-a456-426614174000'],
    };

    const result = createEventSchema.safeParse(eventWithGroups);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.group_ids).toEqual(['123e4567-e89b-12d3-a456-426614174000']);
    }
  });

  it('should default group_ids to empty array', () => {
    const eventWithoutGroups = {
      title: 'Test Incident',
      type: 'incident' as const,
      status: 'investigating' as const,
      severity: 'minor' as const,
      description: 'Test description',
    };

    const result = createEventSchema.safeParse(eventWithoutGroups);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.group_ids).toEqual([]);
    }
  });

  it('should accept both service_ids and group_ids', () => {
    const eventWithBoth = {
      title: 'Test Incident',
      type: 'incident' as const,
      status: 'investigating' as const,
      severity: 'minor' as const,
      description: 'Test description',
      service_ids: ['123e4567-e89b-12d3-a456-426614174001'],
      group_ids: ['123e4567-e89b-12d3-a456-426614174002'],
    };

    const result = createEventSchema.safeParse(eventWithBoth);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.service_ids).toEqual(['123e4567-e89b-12d3-a456-426614174001']);
      expect(result.data.group_ids).toEqual(['123e4567-e89b-12d3-a456-426614174002']);
    }
  });
});

describe('addEventUpdateSchema', () => {
  it('should validate a valid event update', () => {
    const validUpdate = {
      status: 'monitoring' as const,
      message: 'Issue is being monitored',
      notify_subscribers: false,
    };

    const result = addEventUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should require message', () => {
    const invalidUpdate = {
      status: 'monitoring' as const,
      message: '', // empty message
      notify_subscribers: false,
    };

    const result = addEventUpdateSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toEqual(['message']);
    }
  });
});
