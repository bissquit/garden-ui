import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateSubscription, useDeleteSubscription } from './use-subscriptions-mutations';
import { type ReactNode } from 'react';

vi.mock('@/api/client', () => ({
  apiClient: {
    POST: vi.fn(),
    DELETE: vi.fn(),
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

describe('useUpdateSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update subscription successfully', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: {
        data: {
          id: '1',
          user_id: 'user-1',
          service_ids: ['service-1', 'service-2'],
          created_at: '2024-01-01T00:00:00Z',
        },
      },
      error: undefined,
      response: {} as Response,
    } as never);

    const { result } = renderHook(() => useUpdateSubscription(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      service_ids: ['service-1', 'service-2'],
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.POST).toHaveBeenCalledWith('/api/v1/me/subscriptions', {
      body: { service_ids: ['service-1', 'service-2'] },
    });
  });

  it('should handle error when updating subscription fails', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Update failed' } },
      response: {} as Response,
    } as never);

    const { result } = renderHook(() => useUpdateSubscription(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      service_ids: ['service-1'],
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Update failed');
  });
});

describe('useDeleteSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete subscription successfully', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.DELETE).mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { status: 204 } as Response,
    } as never);

    const { result } = renderHook(() => useDeleteSubscription(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.DELETE).toHaveBeenCalledWith('/api/v1/me/subscriptions');
  });

  it('should handle error when deleting subscription fails', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.DELETE).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Delete failed' } },
      response: { status: 500 } as Response,
    } as never);

    const { result } = renderHook(() => useDeleteSubscription(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Delete failed');
  });
});
