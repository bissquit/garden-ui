import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { components } from '@/api/types.generated';

type EventTemplate = components['schemas']['EventTemplate'];

// Hook for fetching templates list (requires auth)
export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async (): Promise<EventTemplate[]> => {
      const { data, error } = await apiClient.GET('/api/v1/templates');

      if (error) throw new Error('Failed to fetch templates');
      return data?.data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - templates change rarely
  });
}
