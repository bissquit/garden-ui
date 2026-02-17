import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { ApiError } from '@/lib/api-error';
import type { components } from '@/api/types.generated';

type ChannelWithSubscriptions = components['schemas']['ChannelWithSubscriptions'];

export function useSubscriptionsMatrix() {
  return useQuery({
    queryKey: ['subscriptions-matrix'],
    queryFn: async (): Promise<ChannelWithSubscriptions[]> => {
      const { data, error, response } = await apiClient.GET('/api/v1/me/subscriptions');

      if (error) {
        throw ApiError.fromResponse(response.status, error, 'Failed to fetch subscriptions');
      }

      return data?.data?.channels ?? [];
    },
  });
}
