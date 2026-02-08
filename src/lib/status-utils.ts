import type { components } from '@/api/types.generated';

type ServiceStatus = components['schemas']['ServiceStatus'];
type EventStatus = components['schemas']['EventStatus'];
type Severity = components['schemas']['Severity'];

// Extended service status config with Tailwind classes
export const serviceStatusConfig: Record<
  ServiceStatus,
  {
    label: string;
    color: string;
    bgClass: string;
    textClass: string;
    bgLightClass: string;
    borderClass: string;
  }
> = {
  operational: {
    label: 'Operational',
    color: 'green',
    bgClass: 'bg-green-500',
    textClass: 'text-green-700 dark:text-green-400',
    bgLightClass: 'bg-green-50 dark:bg-green-950',
    borderClass: 'border-green-200 dark:border-green-800',
  },
  degraded: {
    label: 'Degraded Performance',
    color: 'yellow',
    bgClass: 'bg-yellow-500',
    textClass: 'text-yellow-700 dark:text-yellow-400',
    bgLightClass: 'bg-yellow-50 dark:bg-yellow-950',
    borderClass: 'border-yellow-200 dark:border-yellow-800',
  },
  partial_outage: {
    label: 'Partial Outage',
    color: 'orange',
    bgClass: 'bg-orange-500',
    textClass: 'text-orange-700 dark:text-orange-400',
    bgLightClass: 'bg-orange-50 dark:bg-orange-950',
    borderClass: 'border-orange-200 dark:border-orange-800',
  },
  major_outage: {
    label: 'Major Outage',
    color: 'red',
    bgClass: 'bg-red-500',
    textClass: 'text-red-700 dark:text-red-400',
    bgLightClass: 'bg-red-50 dark:bg-red-950',
    borderClass: 'border-red-200 dark:border-red-800',
  },
  maintenance: {
    label: 'Under Maintenance',
    color: 'blue',
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-700 dark:text-blue-400',
    bgLightClass: 'bg-blue-50 dark:bg-blue-950',
    borderClass: 'border-blue-200 dark:border-blue-800',
  },
};

// Statuses available for events (without operational — events should degrade, not improve)
export const eventServiceStatuses: ServiceStatus[] = [
  'degraded',
  'partial_outage',
  'major_outage',
  'maintenance',
];

// Severity config
export const severityConfig: Record<
  Severity,
  {
    label: string;
    bgClass: string;
    textClass: string;
  }
> = {
  minor: {
    label: 'Minor',
    bgClass: 'bg-yellow-500',
    textClass: 'text-yellow-700 dark:text-yellow-400',
  },
  major: {
    label: 'Major',
    bgClass: 'bg-orange-500',
    textClass: 'text-orange-700 dark:text-orange-400',
  },
  critical: {
    label: 'Critical',
    bgClass: 'bg-red-500',
    textClass: 'text-red-700 dark:text-red-400',
  },
};

// Event status config
export const eventStatusConfig: Record<
  EventStatus,
  {
    label: string;
    icon: string;
  }
> = {
  // Incident statuses
  investigating: { label: 'Investigating', icon: 'search' },
  identified: { label: 'Identified', icon: 'alert-circle' },
  monitoring: { label: 'Monitoring', icon: 'eye' },
  resolved: { label: 'Resolved', icon: 'check-circle' },
  // Maintenance statuses
  scheduled: { label: 'Scheduled', icon: 'calendar' },
  in_progress: { label: 'In Progress', icon: 'loader' },
  completed: { label: 'Completed', icon: 'check-circle' },
};

// Calculate overall system status from services
// Uses effective_status (includes active events) with fallback to status
export function calculateOverallStatus(
  services: Array<{ status: ServiceStatus; effective_status?: ServiceStatus }>
): {
  status: ServiceStatus;
  label: string;
} {
  if (services.length === 0) {
    return { status: 'operational', label: 'All Systems Operational' };
  }

  const hasStatus = (s: ServiceStatus) =>
    services.some((svc) => (svc.effective_status ?? svc.status) === s);

  if (hasStatus('major_outage')) {
    return { status: 'major_outage', label: 'Major System Outage' };
  }
  if (hasStatus('partial_outage')) {
    return { status: 'partial_outage', label: 'Partial System Outage' };
  }
  if (hasStatus('degraded')) {
    return { status: 'degraded', label: 'Degraded System Performance' };
  }
  if (hasStatus('maintenance')) {
    return { status: 'maintenance', label: 'System Under Maintenance' };
  }

  return { status: 'operational', label: 'All Systems Operational' };
}

// Group services by group_ids (M:N relationship - service can belong to multiple groups)
export function groupServices<T extends { group_ids?: string[] }>(
  services: T[],
  groups: Array<{ id: string; name: string; order: number }>
): Array<{ group: { id: string; name: string } | null; services: T[] }> {
  const grouped = new Map<string | null, T[]>();

  // Initialize groups
  grouped.set(null, []); // Ungrouped
  for (const group of groups) {
    grouped.set(group.id, []);
  }

  // Group services - service can appear in multiple groups
  for (const service of services) {
    const groupIds = service.group_ids ?? [];

    if (groupIds.length === 0) {
      // Service without groups goes to Ungrouped
      grouped.get(null)!.push(service);
    } else {
      // Service appears in each of its groups
      for (const groupId of groupIds) {
        if (grouped.has(groupId)) {
          grouped.get(groupId)!.push(service);
        }
      }
    }
  }

  // Build result respecting group order
  const result: Array<{
    group: { id: string; name: string } | null;
    services: T[];
  }> = [];

  // First groups in order
  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);
  for (const group of sortedGroups) {
    const groupServices = grouped.get(group.id);
    if (groupServices && groupServices.length > 0) {
      result.push({
        group: { id: group.id, name: group.name },
        services: groupServices,
      });
    }
  }

  // Then ungrouped services
  const ungrouped = grouped.get(null);
  if (ungrouped && ungrouped.length > 0) {
    result.push({ group: null, services: ungrouped });
  }

  return result;
}

// Filter active events (not resolved/completed)
export function filterActiveEvents<T extends { status: string }>(
  events: T[]
): T[] {
  return events.filter((e) => !['resolved', 'completed'].includes(e.status));
}

// Filter incidents
export function filterIncidents<T extends { type: string }>(events: T[]): T[] {
  return events.filter((e) => e.type === 'incident');
}

// Filter maintenance
export function filterMaintenance<T extends { type: string }>(
  events: T[]
): T[] {
  return events.filter((e) => e.type === 'maintenance');
}

// Format date for display
export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60)
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatEventDate(dateString);
}

// Group events by day for history
export function groupEventsByDay<T extends { created_at: string }>(
  events: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const event of events) {
    const date = new Date(event.created_at);
    const key = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(event);
  }

  return groups;
}