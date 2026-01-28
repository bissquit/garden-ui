import { useQuery } from '@tanstack/react-query';
import { publicClient } from '@/api/client';
import type { components } from '@/api/types.generated';

type Service = components['schemas']['Service'];
type ServiceGroup = components['schemas']['ServiceGroup'];
type Event = components['schemas']['Event'];

// Hook for fetching services list
export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async (): Promise<Service[]> => {
      const { data, error } = await publicClient.GET('/api/v1/services');
      if (error) throw new Error('Failed to fetch services');
      return data?.data ?? [];
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// Hook for fetching groups list
export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async (): Promise<ServiceGroup[]> => {
      const { data, error } = await publicClient.GET('/api/v1/groups');
      if (error) throw new Error('Failed to fetch groups');
      return data?.data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - groups change rarely
  });
}

// Hook for fetching current status (active events)
export function usePublicStatus() {
  return useQuery({
    queryKey: ['public-status'],
    queryFn: async (): Promise<Event[]> => {
      const { data, error } = await publicClient.GET('/api/v1/status');
      if (error) throw new Error('Failed to fetch status');
      return data?.data?.events ?? [];
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// Hook for fetching event history
export function useStatusHistory() {
  return useQuery({
    queryKey: ['status-history'],
    queryFn: async (): Promise<Event[]> => {
      const { data, error } = await publicClient.GET('/api/v1/status/history');
      if (error) throw new Error('Failed to fetch history');
      return data?.data?.events ?? [];
    },
    staleTime: 60 * 1000,
  });
}

// Combined hook for status page data
export function useStatusPageData() {
  const services = useServices();
  const groups = useGroups();
  const status = usePublicStatus();

  return {
    services: services.data,
    groups: groups.data,
    events: status.data,
    isLoading: services.isLoading || groups.isLoading || status.isLoading,
    isError: services.isError || groups.isError || status.isError,
    error: services.error || groups.error || status.error,
    refetch: () => {
      services.refetch();
      groups.refetch();
      status.refetch();
    },
  };
}
