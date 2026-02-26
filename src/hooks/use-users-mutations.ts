import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { components } from '@/api/types.generated';

type AdminCreateUserRequest = components['schemas']['AdminCreateUserRequest'];
type AdminUpdateUserRequest = components['schemas']['AdminUpdateUserRequest'];
type AdminResetPasswordRequest = components['schemas']['AdminResetPasswordRequest'];

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AdminCreateUserRequest) => {
      const { data: result, error, response } = await apiClient.POST('/api/v1/users', {
        body: data,
      });
      if (error) {
        if (response.status === 409) {
          throw new Error('A user with this email already exists');
        }
        if (response.status === 403) {
          throw new Error('Admin role required');
        }
        throw new Error(error.error?.message || 'Failed to create user');
      }
      return result;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AdminUpdateUserRequest }) => {
      const { data: result, error, response } = await apiClient.PATCH('/api/v1/users/{id}', {
        params: { path: { id } },
        body: data,
      });
      if (error) {
        if (response.status === 409) {
          throw new Error('Cannot modify your own account');
        }
        if (response.status === 403) {
          throw new Error('Admin role required');
        }
        throw new Error(error.error?.message || 'Failed to update user');
      }
      return result;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['users'] });
    },
  });
}

export function useAdminResetPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AdminResetPasswordRequest }) => {
      const { error, response } = await apiClient.POST('/api/v1/users/{id}/reset-password', {
        params: { path: { id } },
        body: data,
      });

      if (response.status === 204) {
        return;
      }

      if (error) {
        if (response.status === 409) {
          throw new Error('Cannot reset your own password via this endpoint');
        }
        if (response.status === 403) {
          throw new Error('Admin role required');
        }
        throw new Error(error.error?.message || 'Failed to reset password');
      }
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['users'] });
    },
  });
}
