import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { ApiError } from '@/lib/api-error';
import type { components } from '@/api/types.generated';

type SetChannelSubscriptionsRequest = components['schemas']['SetChannelSubscriptionsRequest'];

interface SetChannelSubscriptionsParams {
  channelId: string;
  data: SetChannelSubscriptionsRequest;
}

export function useSetChannelSubscriptions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ channelId, data }: SetChannelSubscriptionsParams) => {
      const { data: result, error, response } = await apiClient.PUT(
        '/api/v1/me/channels/{id}/subscriptions',
        {
          params: { path: { id: channelId } },
          body: data,
        }
      );

      if (error) {
        throw ApiError.fromResponse(response.status, error, 'Failed to set channel subscriptions');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions-matrix'] });
    },
  });
}
