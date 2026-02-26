'use client';

import { useMutation } from '@tanstack/react-query';
import { publicClient } from '@/api/client';
import { ApiError } from '@/lib/api-error';

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const { data: result, error, response } = await publicClient.POST(
        '/api/v1/auth/forgot-password',
        { body: data }
      );
      if (error) {
        throw ApiError.fromResponse(response.status, error);
      }
      return result?.data?.message;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: { token: string; new_password: string }) => {
      const { error, response } = await publicClient.POST(
        '/api/v1/auth/reset-password',
        { body: data }
      );
      if (response.status === 204) return;
      if (error) {
        throw ApiError.fromResponse(response.status, error);
      }
    },
  });
}
