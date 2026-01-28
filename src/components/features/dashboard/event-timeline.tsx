'use client';

import { eventStatusConfig, formatEventDate } from '@/lib/status-utils';
import type { components } from '@/api/types.generated';

type EventUpdate = components['schemas']['EventUpdate'];

interface EventTimelineProps {
  updates: EventUpdate[];
}

export function EventTimeline({ updates }: EventTimelineProps) {
  // Sort by date (newest first)
  const sorted = [...updates].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">No updates yet.</p>
    );
  }

  return (
    <div className="space-y-6">
      {sorted.map((update, index) => {
        const config = eventStatusConfig[update.status];
        const isLast = index === sorted.length - 1;

        return (
          <div key={update.id} className="relative pl-6">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-border" />
            )}

            {/* Timeline dot */}
            <div className="absolute left-0 top-1 h-[18px] w-[18px] rounded-full border-2 border-primary bg-background" />

            {/* Content */}
            <div className="pb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{config.label}</span>
                <span className="text-sm text-muted-foreground">
                  {formatEventDate(update.created_at)}
                </span>
              </div>
              <p className="text-muted-foreground">{update.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
