import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { components } from '@/api/types.generated';

type CreateGroupRequest = components['schemas']['CreateGroupRequest'];
type UpdateGroupRequest = components['schemas']['UpdateGroupRequest'];

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGroupRequest) => {
      const { data: result, error } = await apiClient.POST('/api/v1/groups', {
        body: data,
      });
      if (error) throw new Error(error.error?.message || 'Failed to create group');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, data }: { slug: string; data: UpdateGroupRequest }) => {
      const { data: result, error } = await apiClient.PATCH('/api/v1/groups/{slug}', {
        params: { path: { slug } },
        body: data,
      });
      if (error) throw new Error(error.error?.message || 'Failed to update group');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await apiClient.DELETE('/api/v1/groups/{slug}', {
        params: { path: { slug } },
      });
      if (error) throw new Error(error.error?.message || 'Failed to delete group');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
