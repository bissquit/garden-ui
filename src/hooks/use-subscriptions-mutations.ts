import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { components } from '@/api/types.generated';

type UpdateSubscriptionRequest = components['schemas']['UpdateSubscriptionRequest'];

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSubscriptionRequest) => {
      const { data: result, error } = await apiClient.POST('/api/v1/me/subscriptions', {
        body: data,
      });
      if (error) throw new Error(error.error?.message || 'Failed to update subscription');
      return result;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['subscription'] });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await apiClient.DELETE('/api/v1/me/subscriptions');
      if (error) throw new Error(error.error?.message || 'Failed to delete subscription');
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['subscription'] });
    },
  });
}
