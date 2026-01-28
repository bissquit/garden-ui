'use client';

import { EventCard } from './event-card';
import { filterActiveEvents, filterIncidents } from '@/lib/status-utils';
import type { components } from '@/api/types.generated';

type Event = components['schemas']['Event'];

interface ActiveIncidentsProps {
  events: Event[];
}

export function ActiveIncidents({ events }: ActiveIncidentsProps) {
  const activeIncidents = filterActiveEvents(filterIncidents(events));

  if (activeIncidents.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Active Incidents
      </h2>
      <div className="space-y-4">
        {activeIncidents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
