import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { components } from '@/api/types.generated';

type CreateEventRequest = components['schemas']['CreateEventRequest'];
type AddEventUpdateRequest = components['schemas']['AddEventUpdateRequest'];

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEventRequest) => {
      const { data: result, error } = await apiClient.POST('/api/v1/events', {
        body: data,
      });
      if (error) throw new Error(error.error?.message || 'Failed to create event');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['public-status'] });
    },
  });
}

export function useAddEventUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, data }: { eventId: string; data: AddEventUpdateRequest }) => {
      const { data: result, error } = await apiClient.POST('/api/v1/events/{id}/updates', {
        params: { path: { id: eventId } },
        body: data,
      });
      if (error) throw new Error(error.error?.message || 'Failed to add update');
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['events', variables.eventId, 'updates'] });
      queryClient.invalidateQueries({ queryKey: ['public-status'] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE('/api/v1/events/{id}', {
        params: { path: { id } },
      });
      if (error) throw new Error(error.error?.message || 'Failed to delete event');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['public-status'] });
    },
  });
}
