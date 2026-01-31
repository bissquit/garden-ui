import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { components } from '@/api/types.generated';

type Event = components['schemas']['Event'];
type EventUpdate = components['schemas']['EventUpdate'];
type EventServiceChange = components['schemas']['EventServiceChange'];
type EventType = components['schemas']['EventType'];
type EventStatus = components['schemas']['EventStatus'];

interface UseEventsParams {
  type?: EventType;
  status?: EventStatus;
}

// Hook for fetching events list (requires auth)
export function useEvents(params?: UseEventsParams) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: async (): Promise<Event[]> => {
      const { data, error } = await apiClient.GET('/api/v1/events', {
        params: {
          query: {
            type: params?.type,
            status: params?.status,
          },
        },
      });

      if (error) throw new Error('Failed to fetch events');
      return data?.data ?? [];
    },
    staleTime: 30 * 1000,
  });
}

// Hook for fetching a single event
export function useEvent(id: string) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: async (): Promise<Event> => {
      const { data, error } = await apiClient.GET('/api/v1/events/{id}', {
        params: { path: { id } },
      });

      if (error) throw new Error('Failed to fetch event');
      if (!data?.data) throw new Error('Event not found');
      return data.data;
    },
    enabled: !!id,
  });
}

// Hook for fetching event updates (timeline)
export function useEventUpdates(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId, 'updates'],
    queryFn: async (): Promise<EventUpdate[]> => {
      const { data, error } = await apiClient.GET('/api/v1/events/{id}/updates', {
        params: { path: { id: eventId } },
      });

      if (error) throw new Error('Failed to fetch event updates');
      return data?.data ?? [];
    },
    enabled: !!eventId,
  });
}

// Hook for fetching event service changes (audit trail)
export function useEventServiceChanges(eventId: string) {
  return useQuery({
    queryKey: ['event-changes', eventId],
    queryFn: async (): Promise<EventServiceChange[]> => {
      const { data, error } = await apiClient.GET('/api/v1/events/{id}/changes', {
        params: { path: { id: eventId } },
      });

      if (error) throw new Error('Failed to fetch service changes');
      return data?.data ?? [];
    },
    enabled: !!eventId,
  });
}
