'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EventForm } from './event-form';
import { useCreateEvent } from '@/hooks/use-events-mutations';
import { useServices, useGroups } from '@/hooks/use-public-status';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import type { CreateEventFormData } from '@/lib/validations/event';

interface EventFormDialogProps {
  trigger?: React.ReactNode;
}

export function EventFormDialog({ trigger }: EventFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { data: services } = useServices();
  const { data: groups } = useGroups();

  const createMutation = useCreateEvent();

  const handleSubmit = async (data: CreateEventFormData) => {
    try {
      // Form now returns affected_services and affected_groups directly
      const requestData = {
        title: data.title,
        type: data.type,
        status: data.status,
        severity: data.severity,
        description: data.description,
        started_at: data.started_at,
        resolved_at: data.resolved_at,
        scheduled_start_at: data.scheduled_start_at,
        scheduled_end_at: data.scheduled_end_at,
        notify_subscribers: data.notify_subscribers,
        template_id: data.template_id,
        affected_services: data.affected_services?.length ? data.affected_services : undefined,
        affected_groups: data.affected_groups?.length ? data.affected_groups : undefined,
      };

      await createMutation.mutateAsync(requestData);
      toast({ title: 'Event created successfully' });
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Failed to create event',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button data-testid="create-event-button">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>
        <EventForm
          services={services ?? []}
          groups={groups ?? []}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
