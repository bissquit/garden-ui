'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { ApiError } from '@/lib/api-error';

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { current_password: string; new_password: string }) => {
      const { error, response } = await apiClient.PUT('/api/v1/me/password', {
        body: data,
      });

      if (response.status === 204) {
        return;
      }

      if (error) {
        throw ApiError.fromResponse(response.status, error);
      }
    },
  });
}
