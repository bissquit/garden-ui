import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { components } from '@/api/types.generated';

type CreateChannelRequest = components['schemas']['CreateChannelRequest'];
type UpdateChannelRequest = components['schemas']['UpdateChannelRequest'];

export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateChannelRequest) => {
      const { data: result, error } = await apiClient.POST('/api/v1/me/channels', {
        body: data,
      });
      if (error) throw new Error(error.error?.message || 'Failed to create channel');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateChannelRequest }) => {
      const { data: result, error } = await apiClient.PATCH('/api/v1/me/channels/{id}', {
        params: { path: { id } },
        body: data,
      });
      if (error) throw new Error(error.error?.message || 'Failed to update channel');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE('/api/v1/me/channels/{id}', {
        params: { path: { id } },
      });
      if (error) throw new Error(error.error?.message || 'Failed to delete channel');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useVerifyChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await apiClient.POST('/api/v1/me/channels/{id}/verify', {
        params: { path: { id } },
      });
      if (error) throw new Error(error.error?.message || 'Failed to verify channel');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}
