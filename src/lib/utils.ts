import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(d, { hour: undefined, minute: undefined });
}

export type ServiceStatus =
  | 'operational'
  | 'degraded'
  | 'partial_outage'
  | 'major_outage'
  | 'maintenance';
export type EventStatus =
  | 'investigating'
  | 'identified'
  | 'monitoring'
  | 'resolved'
  | 'scheduled'
  | 'in_progress'
  | 'completed';
export type Severity = 'minor' | 'major' | 'critical';

export const statusConfig: Record<
  ServiceStatus,
  { label: string; color: string; bgColor: string }
> = {
  operational: {
    label: 'Operational',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  degraded: {
    label: 'Degraded',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  partial_outage: {
    label: 'Partial Outage',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
  },
  major_outage: {
    label: 'Major Outage',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  maintenance: {
    label: 'Maintenance',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
};

export const severityConfig: Record<
  Severity,
  { label: string; color: string; bgColor: string }
> = {
  minor: { label: 'Minor', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  major: { label: 'Major', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  critical: {
    label: 'Critical',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
};

export function formatStatus(status: ServiceStatus): string {
  return statusConfig[status]?.label || status;
}

export function formatSeverity(severity: Severity): string {
  return severityConfig[severity]?.label || severity;
}
