import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { components } from '@/api/types.generated';

type CreateServiceRequest = components['schemas']['CreateServiceRequest'];
type UpdateServiceRequest = components['schemas']['UpdateServiceRequest'];

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServiceRequest) => {
      const { data: result, error } = await apiClient.POST('/api/v1/services', {
        body: data,
      });
      if (error) throw new Error(error.error?.message || 'Failed to create service');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, data }: { slug: string; data: UpdateServiceRequest }) => {
      const { data: result, error } = await apiClient.PATCH('/api/v1/services/{slug}', {
        params: { path: { slug } },
        body: data,
      });
      if (error) throw new Error(error.error?.message || 'Failed to update service');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const { error, response } = await apiClient.DELETE('/api/v1/services/{slug}', {
        params: { path: { slug } },
      });
      if (error) {
        if (response.status === 409) {
          throw new Error('Cannot archive: service has active events');
        }
        throw new Error(error.error?.message || 'Failed to delete service');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useRestoreService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const { data: result, error } = await apiClient.POST('/api/v1/services/{slug}/restore', {
        params: { path: { slug } },
      });
      if (error) throw new Error(error.error?.message || 'Failed to restore service');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}
