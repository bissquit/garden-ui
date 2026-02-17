import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSetChannelSubscriptions } from './use-subscriptions-mutations';
import { type ReactNode } from 'react';

vi.mock('@/api/client', () => ({
  apiClient: {
    PUT: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'TestWrapper';

  return Wrapper;
}

describe('useSetChannelSubscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets subscriptions for channel', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.PUT).mockResolvedValue({
      data: {
        data: {
          channel_id: 'channel-1',
          subscribe_to_all_services: false,
          subscribed_service_ids: ['service-1', 'service-2'],
        },
      },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const { result } = renderHook(() => useSetChannelSubscriptions(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      channelId: 'channel-1',
      data: {
        subscribe_to_all_services: false,
        service_ids: ['service-1', 'service-2'],
      },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.PUT).toHaveBeenCalledWith(
      '/api/v1/me/channels/{id}/subscriptions',
      {
        params: { path: { id: 'channel-1' } },
        body: {
          subscribe_to_all_services: false,
          service_ids: ['service-1', 'service-2'],
        },
      }
    );
  });

  it('handles subscribe_to_all_services', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.PUT).mockResolvedValue({
      data: {
        data: {
          channel_id: 'channel-1',
          subscribe_to_all_services: true,
          subscribed_service_ids: [],
        },
      },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const { result } = renderHook(() => useSetChannelSubscriptions(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      channelId: 'channel-1',
      data: {
        subscribe_to_all_services: true,
        service_ids: [],
      },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.PUT).toHaveBeenCalledWith(
      '/api/v1/me/channels/{id}/subscriptions',
      {
        params: { path: { id: 'channel-1' } },
        body: {
          subscribe_to_all_services: true,
          service_ids: [],
        },
      }
    );
  });

  it('handles specific services subscription', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.PUT).mockResolvedValue({
      data: {
        data: {
          channel_id: 'channel-1',
          subscribe_to_all_services: false,
          subscribed_service_ids: ['uuid-1', 'uuid-2'],
        },
      },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const { result } = renderHook(() => useSetChannelSubscriptions(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      channelId: 'channel-1',
      data: {
        subscribe_to_all_services: false,
        service_ids: ['uuid-1', 'uuid-2'],
      },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('throws ApiError on failure', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.PUT).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Channel not verified' } },
      response: { status: 400 } as Response,
    });

    const { result } = renderHook(() => useSetChannelSubscriptions(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      channelId: 'channel-1',
      data: {
        subscribe_to_all_services: false,
        service_ids: ['service-1'],
      },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
