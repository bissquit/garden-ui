import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVerifyChannel, useResendVerificationCode } from './use-channels-mutations';
import { ApiError } from '@/lib/api-error';
import { type ReactNode } from 'react';

// Mock apiClient
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

describe('useVerifyChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('verifies telegram channel without code', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: {
        data: {
          id: 'channel-1',
          user_id: 'user-1',
          type: 'telegram',
          target: 'john_doe',
          is_enabled: true,
          is_verified: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const { result } = renderHook(() => useVerifyChannel(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 'channel-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.POST).toHaveBeenCalledWith('/api/v1/me/channels/{id}/verify', {
      params: { path: { id: 'channel-1' } },
      body: undefined,
    });
    expect(result.current.data?.data?.is_verified).toBe(true);
  });

  it('verifies email channel with code', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: {
        data: {
          id: 'channel-2',
          user_id: 'user-1',
          type: 'email',
          target: 'test@example.com',
          is_enabled: true,
          is_verified: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const { result } = renderHook(() => useVerifyChannel(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 'channel-2', code: '123456' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.POST).toHaveBeenCalledWith('/api/v1/me/channels/{id}/verify', {
      params: { path: { id: 'channel-2' } },
      body: { code: '123456' },
    });
    expect(result.current.data?.data?.is_verified).toBe(true);
  });

  it('throws error on invalid code', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Invalid verification code' } },
      response: { status: 400 } as Response,
    });

    const { result } = renderHook(() => useVerifyChannel(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 'channel-2', code: '000000' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(400);
    expect((result.current.error as ApiError).message).toBe('Invalid verification code');
  });

  it('invalidates channels query on success', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: {
        data: {
          id: 'channel-1',
          is_verified: true,
        },
      },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    queryClient.setQueryData(['channels'], [{ id: 'channel-1', is_verified: false }]);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useVerifyChannel(), { wrapper });

    result.current.mutate({ id: 'channel-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['channels'] });
  });
});

describe('useResendVerificationCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends resend request', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: { data: { message: 'verification code sent' } },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const { result } = renderHook(() => useResendVerificationCode(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('channel-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.POST).toHaveBeenCalledWith('/api/v1/me/channels/{id}/resend-code', {
      params: { path: { id: 'channel-1' } },
    });
    expect(result.current.data?.message).toBe('verification code sent');
  });

  it('handles rate limit (429)', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'please wait before requesting a new code' } },
      response: { status: 429 } as Response,
    });

    const { result } = renderHook(() => useResendVerificationCode(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('channel-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(429);
    expect((result.current.error as ApiError).message).toBe(
      'Please wait before requesting a new code'
    );
  });

  it('handles channel not found (404)', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Channel not found' } },
      response: { status: 404 } as Response,
    });

    const { result } = renderHook(() => useResendVerificationCode(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('non-existent-channel');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(404);
  });

  it('returns default message when response data is empty', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: {},
      error: undefined,
      response: { status: 200 } as Response,
    });

    const { result } = renderHook(() => useResendVerificationCode(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('channel-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.message).toBe('verification code sent');
  });
});
