'use client';

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActiveEventsWarningProps {
  eventCount?: number;
  className?: string;
}

export function ActiveEventsWarning({
  eventCount = 1,
  className,
}: ActiveEventsWarningProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950',
        className
      )}
    >
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
        <div>
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
            Active Events
          </h4>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            This service is affected by {eventCount} active event
            {eventCount > 1 ? 's' : ''}. Status changes will only take effect
            after all events are resolved. The current displayed status is
            determined by the most severe active event.
          </p>
        </div>
      </div>
    </div>
  );
}
