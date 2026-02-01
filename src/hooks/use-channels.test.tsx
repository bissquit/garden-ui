import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChannels } from './use-channels';
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

describe('useChannels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch channels successfully', async () => {
    const { apiClient } = await import('@/api/client');
    const mockChannels = [
      {
        id: '1',
        user_id: 'user-1',
        type: 'email',
        target: 'test@example.com',
        is_enabled: true,
        is_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    vi.mocked(apiClient.GET).mockResolvedValue({
      data: { data: mockChannels },
      error: undefined,
      response: {} as Response,
    });

    const { result } = renderHook(() => useChannels(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockChannels);
    expect(apiClient.GET).toHaveBeenCalledWith('/api/v1/me/channels');
  });

  it('should return empty array when no channels exist', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.GET).mockResolvedValue({
      data: { data: [] },
      error: undefined,
      response: {} as Response,
    });

    const { result } = renderHook(() => useChannels(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('should handle error when fetching channels fails', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.GET).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Unauthorized' } },
      response: {} as Response,
    });

    const { result } = renderHook(() => useChannels(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to fetch channels');
  });
});
