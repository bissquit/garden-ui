'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { ApiError } from '@/lib/api-error';
import { useAuth } from '@/hooks/use-auth';

export function useUpdateProfile() {
  const { refreshUser } = useAuth();

  return useMutation({
    mutationFn: async (data: { first_name?: string; last_name?: string }) => {
      const { data: responseData, error, response } = await apiClient.PATCH('/api/v1/me', {
        body: data,
      });

      if (error) {
        throw ApiError.fromResponse(response.status, error);
      }

      return responseData;
    },
    onSuccess: async () => {
      await refreshUser();
    },
  });
}
