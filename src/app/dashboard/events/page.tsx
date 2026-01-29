'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEvents } from '@/hooks/use-events';
import {
  EventsTable,
  EventsFilters,
  EventFormDialog,
} from '@/components/features/dashboard';
import { Loader2 } from 'lucide-react';
import type { components } from '@/api/types.generated';

type EventType = components['schemas']['EventType'];
type EventStatus = components['schemas']['EventStatus'];

function EventsPageContent() {
  const searchParams = useSearchParams();

  const type = searchParams.get('type') as EventType | null;
  const status = searchParams.get('status') as EventStatus | null;

  const { data: events, isLoading, isError } = useEvents({
    type: type ?? undefined,
    status: status ?? undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-muted-foreground">View incidents and maintenance</p>
        </div>
        <EventFormDialog />
      </div>

      <EventsFilters />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-center text-destructive py-8">
          Failed to load events. Make sure you are logged in.
        </div>
      ) : (
        <EventsTable events={events ?? []} />
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <EventsPageContent />
    </Suspense>
  );
}
