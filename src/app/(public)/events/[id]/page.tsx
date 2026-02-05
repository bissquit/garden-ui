'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useServices, useGroups } from '@/hooks/use-public-status';
import {
  usePublicEvent,
  usePublicEventUpdates,
  usePublicEventChanges,
} from '@/hooks/use-public-events';
import { EventDetailsCard, EventUnifiedTimeline } from '@/components/features/events';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Loader2 } from 'lucide-react';

export default function PublicEventPage() {
  const params = useParams();
  const eventId = params.id as string;

  const { hasMinRole } = useAuth();

  const { data: event, isLoading: eventLoading, isError } = usePublicEvent(eventId);
  const { data: updates } = usePublicEventUpdates(eventId);
  const { data: changes, isLoading: changesLoading, error: changesError } = usePublicEventChanges(eventId);
  const { data: services } = useServices();
  const { data: groups } = useGroups();

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Status
          </Link>
        </Button>
        <div className="text-center text-muted-foreground py-8">
          Event not found.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Status
          </Link>
        </Button>

        {hasMinRole('operator') && (
          <Button variant="outline" asChild>
            <Link href={`/dashboard/events/${eventId}`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        )}
      </div>

      {/* Event details */}
      <EventDetailsCard
        event={event}
        services={services ?? []}
        groups={groups ?? []}
      />

      {/* Timeline */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Timeline</h2>
        <EventUnifiedTimeline
          event={event}
          updates={updates ?? []}
          changes={changes ?? []}
          services={services ?? []}
          groups={groups ?? []}
          isLoading={changesLoading}
          error={changesError}
        />
      </div>
    </div>
  );
}
