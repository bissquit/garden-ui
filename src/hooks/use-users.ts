import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { components } from '@/api/types.generated';

type User = components['schemas']['User'];
type Role = components['schemas']['Role'];

interface UseUsersParams {
  role?: Role;
  limit?: number;
  offset?: number;
}

interface UseUsersResult {
  users: User[];
  total: number;
  limit: number;
  offset: number;
}

// Hook for fetching paginated users list (admin only)
export function useUsers(params?: UseUsersParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async (): Promise<UseUsersResult> => {
      const { data, error } = await apiClient.GET('/api/v1/users', {
        params: {
          query: {
            role: params?.role,
            limit: params?.limit,
            offset: params?.offset,
          },
        },
      });

      if (error) throw new Error('Failed to fetch users');
      return {
        users: data?.data?.users ?? [],
        total: data?.data?.total ?? 0,
        limit: data?.data?.limit ?? 20,
        offset: data?.data?.offset ?? 0,
      };
    },
    staleTime: 30 * 1000,
  });
}

// Hook for fetching a single user by ID
export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async (): Promise<User> => {
      const { data, error } = await apiClient.GET('/api/v1/users/{id}', {
        params: { path: { id } },
      });

      if (error) throw new Error('Failed to fetch user');
      if (!data?.data) throw new Error('User not found');
      return data.data;
    },
    enabled: !!id,
  });
}
