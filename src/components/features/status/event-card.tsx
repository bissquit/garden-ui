'use client';

import Link from 'next/link';
import { AlertTriangle, Wrench, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  severityConfig,
  eventStatusConfig,
  formatEventDate,
  formatRelativeTime,
} from '@/lib/status-utils';
import type { components } from '@/api/types.generated';

type Event = components['schemas']['Event'];

interface EventCardProps {
  event: Event;
  showDetails?: boolean;
}

export function EventCard({ event, showDetails = true }: EventCardProps) {
  const isIncident = event.type === 'incident';
  const statusConfig = eventStatusConfig[event.status];

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        isIncident
          ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
          : 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          {isIncident ? (
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          ) : (
            <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          )}
          <h3 className="font-semibold text-foreground">{event.title}</h3>
        </div>

        {/* Severity badge for incidents */}
        {isIncident && event.severity && (
          <span
            className={cn(
              'px-2 py-1 rounded text-xs font-medium text-white',
              severityConfig[event.severity].bgClass
            )}
          >
            {severityConfig[event.severity].label}
          </span>
        )}
      </div>

      {/* Status */}
      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium">{statusConfig.label}</span>
        <span>•</span>
        <Clock className="h-4 w-4" />
        <span>
          {event.started_at
            ? formatRelativeTime(event.started_at)
            : formatRelativeTime(event.created_at)}
        </span>
      </div>

      {/* Description */}
      {showDetails && event.description && (
        <p className="mt-3 text-sm text-foreground/80">{event.description}</p>
      )}

      {/* Scheduled time for maintenance */}
      {event.type === 'maintenance' && event.scheduled_start_at && (
        <div className="mt-3 text-sm text-muted-foreground">
          <span className="font-medium">Scheduled: </span>
          {formatEventDate(event.scheduled_start_at)}
          {event.scheduled_end_at && (
            <> — {formatEventDate(event.scheduled_end_at)}</>
          )}
        </div>
      )}

      {/* View details link */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-current/10">
          <Button variant="ghost" size="sm" className="p-0 h-auto" asChild>
            <Link href={`/events/${event.id}`}>
              View details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
