'use client';

import { useRouter } from 'next/navigation';
import { DataTable } from './data-table';
import { EmptyState } from './empty-state';
import { AlertCircle, Wrench, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  severityConfig,
  eventStatusConfig,
  formatRelativeTime,
  isEventActive,
} from '@/lib/status-utils';
import { cn } from '@/lib/utils';
import type { components } from '@/api/types.generated';

type Event = components['schemas']['Event'];

interface EventsTableProps {
  events: Event[];
}

export function EventsTable({ events }: EventsTableProps) {
  const router = useRouter();

  const columns = [
    {
      key: 'title',
      header: 'Title',
      cell: (event: Event) => {
        const active = isEventActive(event.status);
        const iconColor = !active
          ? 'text-muted-foreground'
          : event.type === 'incident'
            ? 'text-red-500'
            : 'text-blue-500';

        return (
          <div className="flex items-center gap-2">
            {event.type === 'incident' ? (
              <AlertCircle className={cn('h-4 w-4', iconColor)} />
            ) : (
              <Wrench className={cn('h-4 w-4', iconColor)} />
            )}
            <span className="font-medium">{event.title}</span>
          </div>
        );
      },
    },
    {
      key: 'severity',
      header: 'Severity',
      cell: (event: Event) => {
        if (!event.severity)
          return <span className="text-muted-foreground">—</span>;
        const config = severityConfig[event.severity];
        const active = isEventActive(event.status);
        const badgeClass = active
          ? cn(config.bgClass, 'text-white')
          : 'bg-muted text-muted-foreground';
        return <Badge className={badgeClass}>{config.label}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (event: Event) => {
        const config = eventStatusConfig[event.status];
        const active = isEventActive(event.status);

        if (active) {
          return (
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              {config.label}
            </Badge>
          );
        }

        return (
          <Badge variant="outline" className="text-green-600 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'created',
      header: 'Created',
      cell: (event: Event) => (
        <span className="text-muted-foreground text-sm">
          {formatRelativeTime(event.created_at)}
        </span>
      ),
      className: 'hidden md:table-cell',
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={events}
      onRowClick={(event) => router.push(`/dashboard/events/${event.id}`)}
      rowClassName={(event) => (!isEventActive(event.status) ? 'opacity-60' : '')}
      emptyState={
        <EmptyState
          icon={AlertCircle}
          title="No events"
          description="No events match the current filters."
        />
      }
    />
  );
}
