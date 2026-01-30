import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateOverallStatus,
  groupServices,
  filterActiveEvents,
  filterIncidents,
  filterMaintenance,
  formatEventDate,
  formatRelativeTime,
  groupEventsByDay,
  serviceStatusConfig,
  severityConfig,
  eventStatusConfig,
} from './status-utils';

describe('calculateOverallStatus', () => {
  it('returns operational when all services are operational', () => {
    const services = [
      { status: 'operational' as const },
      { status: 'operational' as const },
    ];
    expect(calculateOverallStatus(services)).toEqual({
      status: 'operational',
      label: 'All Systems Operational',
    });
  });

  it('returns major_outage when any service has major_outage', () => {
    const services = [
      { status: 'operational' as const },
      { status: 'major_outage' as const },
    ];
    expect(calculateOverallStatus(services).status).toBe('major_outage');
  });

  it('returns partial_outage when any service has partial_outage (no major_outage)', () => {
    const services = [
      { status: 'operational' as const },
      { status: 'partial_outage' as const },
    ];
    expect(calculateOverallStatus(services).status).toBe('partial_outage');
  });

  it('returns partial_outage over degraded', () => {
    const services = [
      { status: 'degraded' as const },
      { status: 'partial_outage' as const },
    ];
    expect(calculateOverallStatus(services).status).toBe('partial_outage');
  });

  it('returns degraded when any service is degraded (no outages)', () => {
    const services = [
      { status: 'operational' as const },
      { status: 'degraded' as const },
    ];
    expect(calculateOverallStatus(services).status).toBe('degraded');
  });

  it('returns maintenance when any service is under maintenance (no outages or degraded)', () => {
    const services = [
      { status: 'operational' as const },
      { status: 'maintenance' as const },
    ];
    expect(calculateOverallStatus(services).status).toBe('maintenance');
  });

  it('handles empty array', () => {
    expect(calculateOverallStatus([]).status).toBe('operational');
  });

  it('prioritizes major_outage over everything else', () => {
    const services = [
      { status: 'major_outage' as const },
      { status: 'partial_outage' as const },
      { status: 'degraded' as const },
      { status: 'maintenance' as const },
    ];
    expect(calculateOverallStatus(services).status).toBe('major_outage');
  });
});

describe('groupServices', () => {
  it('groups services by group_ids', () => {
    const services = [
      { group_ids: ['g1'], name: 'S1' },
      { group_ids: ['g1'], name: 'S2' },
      { group_ids: [], name: 'S3' },
    ];
    const groups = [{ id: 'g1', name: 'Group 1', order: 0 }];

    const result = groupServices(services, groups);

    expect(result).toHaveLength(2);
    expect(result[0].group?.name).toBe('Group 1');
    expect(result[0].services).toHaveLength(2);
    expect(result[1].group).toBeNull();
    expect(result[1].services).toHaveLength(1);
  });

  it('respects group order', () => {
    const services = [
      { group_ids: ['g1'], name: 'S1' },
      { group_ids: ['g2'], name: 'S2' },
    ];
    const groups = [
      { id: 'g2', name: 'Second', order: 1 },
      { id: 'g1', name: 'First', order: 0 },
    ];

    const result = groupServices(services, groups);

    expect(result[0].group?.name).toBe('First');
    expect(result[1].group?.name).toBe('Second');
  });

  it('puts ungrouped services at the end', () => {
    const services = [
      { group_ids: [], name: 'Ungrouped' },
      { group_ids: ['g1'], name: 'Grouped' },
    ];
    const groups = [{ id: 'g1', name: 'Group', order: 0 }];

    const result = groupServices(services, groups);

    expect(result).toHaveLength(2);
    expect(result[0].group?.name).toBe('Group');
    expect(result[1].group).toBeNull();
  });

  it('handles empty services array', () => {
    const result = groupServices([], [{ id: 'g1', name: 'Group', order: 0 }]);
    expect(result).toHaveLength(0);
  });

  it('handles empty groups array', () => {
    const services = [{ group_ids: [], name: 'S1' }];
    const result = groupServices(services, []);

    expect(result).toHaveLength(1);
    expect(result[0].group).toBeNull();
  });

  it('allows service to appear in multiple groups', () => {
    const services = [
      { group_ids: ['g1', 'g2'], name: 'Multi-group Service' },
      { group_ids: ['g1'], name: 'Group 1 Only' },
    ];
    const groups = [
      { id: 'g1', name: 'Group 1', order: 0 },
      { id: 'g2', name: 'Group 2', order: 1 },
    ];

    const result = groupServices(services, groups);

    expect(result).toHaveLength(2);
    // Group 1 should have both services
    expect(result[0].group?.name).toBe('Group 1');
    expect(result[0].services).toHaveLength(2);
    // Group 2 should have only the multi-group service
    expect(result[1].group?.name).toBe('Group 2');
    expect(result[1].services).toHaveLength(1);
    expect(result[1].services[0].name).toBe('Multi-group Service');
  });
});

describe('filterActiveEvents', () => {
  it('filters out resolved and completed events', () => {
    const events = [
      { status: 'investigating' },
      { status: 'resolved' },
      { status: 'in_progress' },
      { status: 'completed' },
      { status: 'scheduled' },
    ];

    const result = filterActiveEvents(events);

    expect(result).toHaveLength(3);
    expect(result.map((e) => e.status)).toEqual([
      'investigating',
      'in_progress',
      'scheduled',
    ]);
  });

  it('returns all events when none are resolved/completed', () => {
    const events = [{ status: 'investigating' }, { status: 'monitoring' }];

    expect(filterActiveEvents(events)).toHaveLength(2);
  });

  it('handles empty array', () => {
    expect(filterActiveEvents([])).toHaveLength(0);
  });
});

describe('filterIncidents', () => {
  it('returns only incidents', () => {
    const events = [
      { type: 'incident' },
      { type: 'maintenance' },
      { type: 'incident' },
    ];

    const result = filterIncidents(events);

    expect(result).toHaveLength(2);
    expect(result.every((e) => e.type === 'incident')).toBe(true);
  });

  it('handles empty array', () => {
    expect(filterIncidents([])).toHaveLength(0);
  });
});

describe('filterMaintenance', () => {
  it('returns only maintenance events', () => {
    const events = [
      { type: 'incident' },
      { type: 'maintenance' },
      { type: 'maintenance' },
    ];

    const result = filterMaintenance(events);

    expect(result).toHaveLength(2);
    expect(result.every((e) => e.type === 'maintenance')).toBe(true);
  });

  it('handles empty array', () => {
    expect(filterMaintenance([])).toHaveLength(0);
  });
});

describe('formatEventDate', () => {
  it('formats date correctly', () => {
    const date = '2026-01-15T14:30:00Z';
    const result = formatEventDate(date);

    // Should include month, day, hour, minute
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/15/);
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-27T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for times less than a minute ago', () => {
    const date = new Date(Date.now() - 30 * 1000).toISOString(); // 30 seconds ago
    expect(formatRelativeTime(date)).toBe('just now');
  });

  it('returns minutes ago for times less than an hour ago', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
    expect(formatRelativeTime(date)).toBe('5 minutes ago');
  });

  it('returns "1 minute ago" for singular', () => {
    const date = new Date(Date.now() - 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('1 minute ago');
  });

  it('returns hours ago for times less than a day ago', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // 3 hours ago
    expect(formatRelativeTime(date)).toBe('3 hours ago');
  });

  it('returns "1 hour ago" for singular', () => {
    const date = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('1 hour ago');
  });

  it('returns days ago for times less than a week ago', () => {
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
    expect(formatRelativeTime(date)).toBe('2 days ago');
  });

  it('returns formatted date for times more than a week ago', () => {
    const date = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(); // 8 days ago
    const result = formatRelativeTime(date);
    expect(result).toMatch(/Jan/);
  });
});

describe('groupEventsByDay', () => {
  it('groups events by day', () => {
    const events = [
      { created_at: '2026-01-15T10:00:00Z' },
      { created_at: '2026-01-15T14:00:00Z' },
      { created_at: '2026-01-14T08:00:00Z' },
    ];

    const result = groupEventsByDay(events);

    expect(result.size).toBe(2);
    const jan15Events = result.get('Jan 15, 2026');
    const jan14Events = result.get('Jan 14, 2026');
    expect(jan15Events).toHaveLength(2);
    expect(jan14Events).toHaveLength(1);
  });

  it('handles empty array', () => {
    const result = groupEventsByDay([]);
    expect(result.size).toBe(0);
  });
});

describe('config objects', () => {
  it('serviceStatusConfig has all required statuses', () => {
    const statuses = [
      'operational',
      'degraded',
      'partial_outage',
      'major_outage',
      'maintenance',
    ] as const;

    for (const status of statuses) {
      expect(serviceStatusConfig[status]).toBeDefined();
      expect(serviceStatusConfig[status].label).toBeDefined();
      expect(serviceStatusConfig[status].bgClass).toBeDefined();
      expect(serviceStatusConfig[status].textClass).toBeDefined();
    }
  });

  it('severityConfig has all required severities', () => {
    const severities = ['minor', 'major', 'critical'] as const;

    for (const severity of severities) {
      expect(severityConfig[severity]).toBeDefined();
      expect(severityConfig[severity].label).toBeDefined();
      expect(severityConfig[severity].bgClass).toBeDefined();
    }
  });

  it('eventStatusConfig has all required statuses', () => {
    const statuses = [
      'investigating',
      'identified',
      'monitoring',
      'resolved',
      'scheduled',
      'in_progress',
      'completed',
    ] as const;

    for (const status of statuses) {
      expect(eventStatusConfig[status]).toBeDefined();
      expect(eventStatusConfig[status].label).toBeDefined();
    }
  });
});
