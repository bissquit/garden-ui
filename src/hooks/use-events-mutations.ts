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
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['events'] }),
        queryClient.refetchQueries({ queryKey: ['public-status'] }),
      ]);
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
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['events'] }),
        queryClient.refetchQueries({ queryKey: ['events', variables.eventId] }),
        queryClient.refetchQueries({ queryKey: ['events', variables.eventId, 'updates'] }),
        queryClient.refetchQueries({ queryKey: ['event-changes', variables.eventId] }),
        queryClient.refetchQueries({ queryKey: ['public-status'] }),
        queryClient.refetchQueries({ queryKey: ['services'] }),
      ]);
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
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['events'] }),
        queryClient.refetchQueries({ queryKey: ['public-status'] }),
        queryClient.refetchQueries({ queryKey: ['services'] }),
      ]);
    },
  });
}
