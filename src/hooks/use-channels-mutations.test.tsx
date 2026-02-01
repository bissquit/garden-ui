import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCreateChannel,
  useUpdateChannel,
  useDeleteChannel,
  useVerifyChannel,
} from './use-channels-mutations';
import { type ReactNode } from 'react';

vi.mock('@/api/client', () => ({
  apiClient: {
    POST: vi.fn(),
    PATCH: vi.fn(),
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

describe('useCreateChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a channel successfully', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: { data: { id: '1', type: 'email', target: 'test@example.com' } },
      error: undefined,
      response: {} as Response,
    });

    const { result } = renderHook(() => useCreateChannel(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      type: 'email',
      target: 'test@example.com',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.POST).toHaveBeenCalledWith('/api/v1/me/channels', {
      body: { type: 'email', target: 'test@example.com' },
    });
  });

  it('should handle error when creating channel fails', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Channel already exists' } },
      response: {} as Response,
    });

    const { result } = renderHook(() => useCreateChannel(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      type: 'email',
      target: 'test@example.com',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Channel already exists');
  });
});

describe('useUpdateChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update a channel successfully', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.PATCH).mockResolvedValue({
      data: {
        data: {
          id: '1',
          user_id: 'user-1',
          type: 'email',
          target: 'test@example.com',
          is_enabled: false,
          is_verified: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      },
      error: undefined,
      response: {} as Response,
    } as never);

    const { result } = renderHook(() => useUpdateChannel(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'channel-1',
      data: { is_enabled: false },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.PATCH).toHaveBeenCalledWith('/api/v1/me/channels/{id}', {
      params: { path: { id: 'channel-1' } },
      body: { is_enabled: false },
    });
  });

  it('should handle error when updating channel fails', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.PATCH).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Channel not found' } },
      response: {} as Response,
    } as never);

    const { result } = renderHook(() => useUpdateChannel(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'channel-1',
      data: { is_enabled: false },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Channel not found');
  });
});

describe('useDeleteChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete a channel successfully', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.DELETE).mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { status: 204 } as Response,
    });

    const { result } = renderHook(() => useDeleteChannel(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('channel-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.DELETE).toHaveBeenCalledWith('/api/v1/me/channels/{id}', {
      params: { path: { id: 'channel-1' } },
    });
  });

  it('should handle error when deleting channel fails', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.DELETE).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Channel not found' } },
      response: { status: 404 } as Response,
    });

    const { result } = renderHook(() => useDeleteChannel(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('channel-1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Channel not found');
  });
});

describe('useVerifyChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify a channel successfully', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: { data: { id: '1', is_verified: true } },
      error: undefined,
      response: {} as Response,
    });

    const { result } = renderHook(() => useVerifyChannel(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('channel-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.POST).toHaveBeenCalledWith('/api/v1/me/channels/{id}/verify', {
      params: { path: { id: 'channel-1' } },
    });
  });

  it('should handle error when verifying channel fails', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Verification failed' } },
      response: {} as Response,
    });

    const { result } = renderHook(() => useVerifyChannel(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('channel-1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Verification failed');
  });
});
