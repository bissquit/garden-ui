import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { components } from '@/api/types.generated';

type CreateTemplateRequest = components['schemas']['CreateTemplateRequest'];

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTemplateRequest) => {
      const { data: result, error } = await apiClient.POST('/api/v1/templates', {
        body: data,
      });
      if (error) throw new Error(error.error?.message || 'Failed to create template');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE('/api/v1/templates/{id}', {
        params: { path: { id } },
      });
      if (error) throw new Error(error.error?.message || 'Failed to delete template');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}
