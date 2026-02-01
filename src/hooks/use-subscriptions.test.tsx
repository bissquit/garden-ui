import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubscription } from './use-subscriptions';
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

describe('useSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch subscription successfully', async () => {
    const { apiClient } = await import('@/api/client');
    const mockSubscription = {
      id: '1',
      user_id: 'user-1',
      service_ids: ['service-1', 'service-2'],
      created_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(apiClient.GET).mockResolvedValue({
      data: { data: mockSubscription },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const { result } = renderHook(() => useSubscription(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSubscription);
    expect(apiClient.GET).toHaveBeenCalledWith('/api/v1/me/subscriptions');
  });

  it('should return null when no subscription exists (404)', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.GET).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Not found' } },
      response: { status: 404 } as Response,
    });

    const { result } = renderHook(() => useSubscription(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it('should handle error when fetching subscription fails', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.GET).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Server error' } },
      response: { status: 500 } as Response,
    });

    const { result } = renderHook(() => useSubscription(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to fetch subscription');
  });
});
