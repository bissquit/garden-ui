import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { components } from '@/api/types.generated';

type NotificationChannel = components['schemas']['NotificationChannel'];

export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: async (): Promise<NotificationChannel[]> => {
      const { data, error } = await apiClient.GET('/api/v1/me/channels');

      if (error) throw new Error('Failed to fetch channels');
      return data?.data ?? [];
    },
  });
}
