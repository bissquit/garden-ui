import { describe, it, expect } from 'vitest';
import {
  cn,
  formatDate,
  formatRelativeTime,
  formatStatus,
  formatSeverity,
} from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('formatDate', () => {
  it('formats date string', () => {
    const result = formatDate('2026-01-22T10:30:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('22');
    expect(result).toContain('2026');
  });

  it('formats Date object', () => {
    const date = new Date('2026-01-22T10:30:00Z');
    const result = formatDate(date);
    expect(result).toContain('Jan');
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" for recent times', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('returns minutes ago', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(date)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(date)).toBe('3h ago');
  });

  it('returns days ago', () => {
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(date)).toBe('2d ago');
  });
});

describe('formatStatus', () => {
  it('formats operational status', () => {
    expect(formatStatus('operational')).toBe('Operational');
  });

  it('formats partial_outage status', () => {
    expect(formatStatus('partial_outage')).toBe('Partial Outage');
  });

  it('formats major_outage status', () => {
    expect(formatStatus('major_outage')).toBe('Major Outage');
  });

  it('formats maintenance status', () => {
    expect(formatStatus('maintenance')).toBe('Maintenance');
  });
});

describe('formatSeverity', () => {
  it('formats minor severity', () => {
    expect(formatSeverity('minor')).toBe('Minor');
  });

  it('formats major severity', () => {
    expect(formatSeverity('major')).toBe('Major');
  });

  it('formats critical severity', () => {
    expect(formatSeverity('critical')).toBe('Critical');
  });
});
