import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChangePassword } from './use-change-password';
import { ApiError } from '@/lib/api-error';
import { type ReactNode, createElement } from 'react';

// Mock apiClient
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

  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = 'TestWrapper';

  return Wrapper;
}

describe('useChangePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls PUT /api/v1/me/password with correct body', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.PUT).mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { status: 204 } as Response,
    });

    const { result } = renderHook(() => useChangePassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      current_password: 'oldpass123',
      new_password: 'newpass123',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.PUT).toHaveBeenCalledWith('/api/v1/me/password', {
      body: {
        current_password: 'oldpass123',
        new_password: 'newpass123',
      },
    });
  });

  it('returns successfully on 204 response', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.PUT).mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { status: 204 } as Response,
    });

    const { result } = renderHook(() => useChangePassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      current_password: 'oldpass123',
      new_password: 'newpass123',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.error).toBeNull();
  });

  it('throws ApiError on 400 response', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.PUT).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Current password is incorrect' } },
      response: { status: 400 } as Response,
    });

    const { result } = renderHook(() => useChangePassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      current_password: 'wrongpass',
      new_password: 'newpass123',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(400);
    expect((result.current.error as ApiError).message).toBe('Current password is incorrect');
  });
});
