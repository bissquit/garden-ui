import { useQuery } from '@tanstack/react-query';
import { publicClient } from '@/api/client';
import type { components } from '@/api/types.generated';

type Event = components['schemas']['Event'];
type EventUpdate = components['schemas']['EventUpdate'];
type EventServiceChange = components['schemas']['EventServiceChange'];

export function usePublicEvent(id: string) {
  return useQuery({
    queryKey: ['public-event', id],
    queryFn: async (): Promise<Event> => {
      const { data, error } = await publicClient.GET('/api/v1/events/{id}', {
        params: { path: { id } },
      });
      if (error) throw new Error('Failed to fetch event');
      if (!data?.data) throw new Error('Event not found');
      return data.data;
    },
    enabled: !!id,
  });
}

export function usePublicEventUpdates(eventId: string) {
  return useQuery({
    queryKey: ['public-event-updates', eventId],
    queryFn: async (): Promise<EventUpdate[]> => {
      const { data, error } = await publicClient.GET('/api/v1/events/{id}/updates', {
        params: { path: { id: eventId } },
      });
      if (error) throw new Error('Failed to fetch event updates');
      return data?.data ?? [];
    },
    enabled: !!eventId,
  });
}

export function usePublicEventChanges(eventId: string) {
  return useQuery({
    queryKey: ['public-event-changes', eventId],
    queryFn: async (): Promise<EventServiceChange[]> => {
      const { data, error } = await publicClient.GET('/api/v1/events/{id}/changes', {
        params: { path: { id: eventId } },
      });
      if (error) throw new Error('Failed to fetch service changes');
      return data?.data ?? [];
    },
    enabled: !!eventId,
  });
}
