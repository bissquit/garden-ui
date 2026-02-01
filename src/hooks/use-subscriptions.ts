import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { components } from '@/api/types.generated';

type Subscription = components['schemas']['Subscription'];

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async (): Promise<Subscription | null> => {
      const { data, error, response } = await apiClient.GET('/api/v1/me/subscriptions');

      // 404 means no subscription exists yet - this is valid
      if (response.status === 404) {
        return null;
      }

      if (error) throw new Error('Failed to fetch subscription');
      return data?.data ?? null;
    },
  });
}
