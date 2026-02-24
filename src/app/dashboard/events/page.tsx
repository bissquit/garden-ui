'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEvents } from '@/hooks/use-events';
import {
  EventsTable,
  EventsFilters,
  EventFormDialog,
} from '@/components/features/dashboard';
import { DashboardTableSkeleton } from '@/components/features/dashboard';
import { isEventActive } from '@/lib/status-utils';
import type { components } from '@/api/types.generated';

type EventType = components['schemas']['EventType'];
type EventStatus = components['schemas']['EventStatus'];

function EventsPageContent() {
  const searchParams = useSearchParams();
  const { hasMinRole } = useAuth();
  const canEdit = hasMinRole('operator');

  const type = searchParams.get('type') as EventType | null;
  const status = searchParams.get('status') as EventStatus | null;
  const active = searchParams.get('active') === 'true';

  const { data: events, isLoading, isError } = useEvents({
    type: type ?? undefined,
    status: status ?? undefined,
  });

  const filteredEvents = useMemo(() => {
    const list = events ?? [];
    return active ? list.filter((e) => isEventActive(e.status)) : list;
  }, [events, active]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-muted-foreground">View incidents and maintenance</p>
        </div>
        {canEdit && <EventFormDialog />}
      </div>

      <EventsFilters />

      {isLoading ? (
        <DashboardTableSkeleton />
      ) : isError ? (
        <div className="text-center text-destructive py-8">
          Failed to load events. Make sure you are logged in.
        </div>
      ) : (
        <EventsTable events={filteredEvents} />
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<DashboardTableSkeleton />}>
      <EventsPageContent />
    </Suspense>
  );
}
