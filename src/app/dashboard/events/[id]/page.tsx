'use client';

import { useAuth } from '@/hooks/use-auth';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useEvent, useEventUpdates } from '@/hooks/use-events';
import { EventDetailsCard, EventTimeline } from '@/components/features/dashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function EventDetailsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const {
    data: event,
    isLoading: eventLoading,
    isError: eventError,
  } = useEvent(eventId);
  const { data: updates, isLoading: updatesLoading } = useEventUpdates(eventId);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || eventLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (eventError || !event) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-center text-destructive py-8">
          Event not found or you don&apos;t have permission to view it.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/dashboard/events')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Events
      </Button>

      <EventDetailsCard event={event} />

      <div>
        <h2 className="text-lg font-semibold mb-4">Timeline</h2>
        {updatesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <EventTimeline updates={updates ?? []} />
        )}
      </div>
    </div>
  );
}
