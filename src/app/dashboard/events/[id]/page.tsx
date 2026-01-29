'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEvent, useEventUpdates } from '@/hooks/use-events';
import { useAddEventUpdate, useDeleteEvent } from '@/hooks/use-events-mutations';
import { useAuth } from '@/hooks/use-auth';
import {
  EventDetailsCard,
  EventTimeline,
  EventUpdateForm,
  DeleteConfirmationDialog,
} from '@/components/features/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import type { AddEventUpdateFormData } from '@/lib/validations/event';

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const eventId = params.id as string;

  const { data: event, isLoading: eventLoading, isError: eventError } = useEvent(eventId);
  const { data: updates, isLoading: updatesLoading } = useEventUpdates(eventId);

  const addUpdateMutation = useAddEventUpdate();
  const deleteMutation = useDeleteEvent();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleAddUpdate = async (data: AddEventUpdateFormData) => {
    try {
      await addUpdateMutation.mutateAsync({ eventId, data });
      toast({ title: 'Update posted successfully' });
    } catch (error) {
      toast({
        title: 'Failed to post update',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(eventId);
      toast({ title: 'Event deleted successfully' });
      router.push('/dashboard/events');
    } catch (error) {
      toast({
        title: 'Failed to delete event',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
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

  const isResolved = event.status === 'resolved' || event.status === 'completed';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/dashboard/events')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        {isAdmin && (
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Event
          </Button>
        )}
      </div>

      <EventDetailsCard event={event} />

      {/* Add Update Form - only show if not resolved */}
      {!isResolved && (
        <Card>
          <CardHeader>
            <CardTitle>Post Update</CardTitle>
          </CardHeader>
          <CardContent>
            <EventUpdateForm
              eventType={event.type}
              currentStatus={event.status}
              onSubmit={handleAddUpdate}
              isLoading={addUpdateMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
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

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Event"
        description="Are you sure you want to delete this event? All updates will also be deleted. This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
