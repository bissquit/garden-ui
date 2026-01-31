'use client';

import { HistoryDayGroup } from './history-day-group';
import { groupEventsByDay } from '@/lib/status-utils';
import type { components } from '@/api/types.generated';

type Event = components['schemas']['Event'];

interface HistoryListProps {
  events: Event[];
}

export function HistoryList({ events }: HistoryListProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No events in history.
      </div>
    );
  }

  // Sort by date (newest first)
  const sorted = [...events].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const grouped = groupEventsByDay(sorted);

  return (
    <div className="space-y-8" data-testid="history-list">
      {Array.from(grouped.entries()).map(([date, dayEvents]) => (
        <HistoryDayGroup key={date} date={date} events={dayEvents} />
      ))}
    </div>
  );
}
