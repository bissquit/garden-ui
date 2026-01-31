import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

export function useServiceTags(slug: string) {
  return useQuery({
    queryKey: ['service-tags', slug],
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await apiClient.GET(
        '/api/v1/services/{slug}/tags',
        {
          params: { path: { slug } },
        }
      );
      if (error) throw new Error(error.error?.message || 'Failed to fetch service tags');
      return data?.data?.tags ?? {};
    },
    enabled: !!slug,
  });
}

export function useUpdateServiceTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      tags,
    }: {
      slug: string;
      tags: Record<string, string>;
    }) => {
      const { data, error } = await apiClient.PUT(
        '/api/v1/services/{slug}/tags',
        {
          params: { path: { slug } },
          body: { tags },
        }
      );
      if (error) throw new Error(error.error?.message || 'Failed to update service tags');
      return data;
    },
    onSuccess: (_, { slug }) => {
      queryClient.invalidateQueries({ queryKey: ['service-tags', slug] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}
