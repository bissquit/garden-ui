import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { ApiError } from '@/lib/api-error';
import type { components } from '@/api/types.generated';

type CreateChannelRequest = components['schemas']['CreateChannelRequest'];
type UpdateChannelRequest = components['schemas']['UpdateChannelRequest'];
type VerifyChannelRequest = components['schemas']['VerifyChannelRequest'];

interface VerifyChannelParams {
  id: string;
  /** 6-digit code, required for email channels */
  code?: string;
}

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
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-matrix'] });
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
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-matrix'] });
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
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-matrix'] });
    },
  });
}

export function useVerifyChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, code }: VerifyChannelParams) => {
      const body: VerifyChannelRequest | undefined = code ? { code } : undefined;

      const { data, error, response } = await apiClient.POST(
        '/api/v1/me/channels/{id}/verify',
        {
          params: { path: { id } },
          body,
        }
      );

      if (error) {
        throw ApiError.fromResponse(response.status, error);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-matrix'] });
    },
  });
}

interface ResendCodeResult {
  message: string;
}

export function useResendVerificationCode() {
  return useMutation({
    mutationFn: async (channelId: string): Promise<ResendCodeResult> => {
      const { data, error, response } = await apiClient.POST(
        '/api/v1/me/channels/{id}/resend-code',
        {
          params: { path: { id: channelId } },
        }
      );

      if (error) {
        if (response.status === 429) {
          throw new ApiError(429, 'Please wait before requesting a new code');
        }
        throw ApiError.fromResponse(response.status, error);
      }

      return { message: data?.data?.message ?? 'verification code sent' };
    },
  });
}
