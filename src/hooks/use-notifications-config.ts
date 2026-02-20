import { useQuery } from '@tanstack/react-query';
import { publicClient } from '@/api/client';
import type { components } from '@/api/types.generated';

type NotificationsConfig = NonNullable<
  components['schemas']['NotificationsConfigResponse']['data']
>;

export type AvailableChannelType = NotificationsConfig['available_channels'][number];

const emptyConfig: NotificationsConfig = { available_channels: [] };

export function useNotificationsConfig() {
  return useQuery({
    queryKey: ['notifications-config'],
    queryFn: async (): Promise<NotificationsConfig> => {
      const { data, error } = await publicClient.GET(
        '/api/v1/notifications/config'
      );
      if (error) throw new Error('Failed to fetch notifications config');
      return data?.data ?? emptyConfig;
    },
    staleTime: 5 * 60 * 1000,
  });
}
