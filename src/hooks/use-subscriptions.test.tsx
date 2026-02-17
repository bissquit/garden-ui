import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubscriptionsMatrix } from './use-subscriptions';
import { type ReactNode } from 'react';

vi.mock('@/api/client', () => ({
  apiClient: {
    GET: vi.fn(),
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

describe('useSubscriptionsMatrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when no channels', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.GET).mockResolvedValue({
      data: { data: { channels: [] } },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const { result } = renderHook(() => useSubscriptionsMatrix(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
    expect(apiClient.GET).toHaveBeenCalledWith('/api/v1/me/subscriptions');
  });

  it('returns channels with subscriptions', async () => {
    const { apiClient } = await import('@/api/client');
    const mockChannels = [
      {
        channel: {
          id: 'channel-1',
          user_id: 'user-1',
          type: 'email',
          target: 'test@example.com',
          is_enabled: true,
          is_verified: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        subscribe_to_all_services: false,
        subscribed_service_ids: ['service-1', 'service-2'],
      },
      {
        channel: {
          id: 'channel-2',
          user_id: 'user-1',
          type: 'telegram',
          target: 'telegram_user',
          is_enabled: true,
          is_verified: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        subscribe_to_all_services: true,
        subscribed_service_ids: [],
      },
    ];

    vi.mocked(apiClient.GET).mockResolvedValue({
      data: { data: { channels: mockChannels } },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const { result } = renderHook(() => useSubscriptionsMatrix(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockChannels);
  });

  it('throws ApiError on failure', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.GET).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Server error' } },
      response: { status: 500 } as Response,
    });

    const { result } = renderHook(() => useSubscriptionsMatrix(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
