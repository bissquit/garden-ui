'use client';

import { EventCard } from './event-card';
import type { components } from '@/api/types.generated';

type Event = components['schemas']['Event'];

interface HistoryDayGroupProps {
  date: string;
  events: Event[];
}

export function HistoryDayGroup({ date, events }: HistoryDayGroupProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        {date}
      </h3>
      <div className="space-y-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} showDetails={false} />
        ))}
      </div>
    </div>
  );
}
