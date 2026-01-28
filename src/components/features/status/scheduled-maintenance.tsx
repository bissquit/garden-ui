'use client';

import { EventCard } from './event-card';
import { filterMaintenance } from '@/lib/status-utils';
import type { components } from '@/api/types.generated';

type Event = components['schemas']['Event'];

interface ScheduledMaintenanceProps {
  events: Event[];
}

export function ScheduledMaintenance({ events }: ScheduledMaintenanceProps) {
  // Show scheduled and in_progress maintenance
  const maintenance = filterMaintenance(events).filter(
    (e) => e.status === 'scheduled' || e.status === 'in_progress'
  );

  if (maintenance.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Scheduled Maintenance
      </h2>
      <div className="space-y-4">
        {maintenance.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
