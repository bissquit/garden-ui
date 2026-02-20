import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotificationsConfig } from './use-notifications-config';
import type { ReactNode } from 'react';

vi.mock('@/api/client', () => ({
  publicClient: {
    GET: vi.fn(),
  },
}));

import { publicClient } from '@/api/client';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useNotificationsConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches notifications config successfully', async () => {
    const mockConfig = {
      available_channels: ['email', 'telegram'],
      telegram: { bot_username: 'my_bot' },
    };

    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: { data: mockConfig },
      error: undefined,
    } as never);

    const { result } = renderHook(() => useNotificationsConfig(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockConfig);
    expect(publicClient.GET).toHaveBeenCalledWith(
      '/api/v1/notifications/config'
    );
  });

  it('returns default empty config when data is null', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: { data: null },
      error: undefined,
    } as never);

    const { result } = renderHook(() => useNotificationsConfig(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ available_channels: [] });
  });

  it('handles config with single channel type', async () => {
    const mockConfig = {
      available_channels: ['mattermost'],
    };

    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: { data: mockConfig },
      error: undefined,
    } as never);

    const { result } = renderHook(() => useNotificationsConfig(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.available_channels).toEqual(['mattermost']);
    expect(result.current.data?.telegram).toBeUndefined();
  });

  it('handles fetch error', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: undefined,
      error: { error: { message: 'Error' } },
    } as never);

    const { result } = renderHook(() => useNotificationsConfig(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe(
      'Failed to fetch notifications config'
    );
  });
});
