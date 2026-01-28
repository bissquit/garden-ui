'use client';

import { useRouter } from 'next/navigation';
import { DataTable } from './data-table';
import { EmptyState } from './empty-state';
import { AlertCircle, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  severityConfig,
  eventStatusConfig,
  formatRelativeTime,
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
      cell: (event: Event) => (
        <div className="flex items-center gap-2">
          {event.type === 'incident' ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <Wrench className="h-4 w-4 text-blue-500" />
          )}
          <span className="font-medium">{event.title}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (event: Event) => (
        <Badge variant={event.type === 'incident' ? 'destructive' : 'secondary'}>
          {event.type}
        </Badge>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      cell: (event: Event) => {
        if (!event.severity)
          return <span className="text-muted-foreground">—</span>;
        const config = severityConfig[event.severity];
        return <Badge className={cn(config.bgClass, 'text-white')}>{config.label}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (event: Event) => {
        const config = eventStatusConfig[event.status];
        return <span>{config.label}</span>;
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
