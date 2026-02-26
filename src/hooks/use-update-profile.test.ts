import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateProfile } from './use-update-profile';
import { ApiError } from '@/lib/api-error';
import { type ReactNode, createElement } from 'react';

// Mock apiClient
vi.mock('@/api/client', () => ({
  apiClient: {
    PATCH: vi.fn(),
  },
}));

// Mock useAuth
const mockRefreshUser = vi.fn();
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    refreshUser: mockRefreshUser,
  }),
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

describe('useUpdateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls PATCH /api/v1/me with correct body', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.PATCH).mockResolvedValue({
      data: { data: { id: '1', first_name: 'John', last_name: 'Doe' } },
      error: undefined,
      response: { status: 200 } as Response,
    } as any);
    mockRefreshUser.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      first_name: 'John',
      last_name: 'Doe',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.PATCH).toHaveBeenCalledWith('/api/v1/me', {
      body: {
        first_name: 'John',
        last_name: 'Doe',
      },
    });
  });

  it('calls refreshUser on success', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.PATCH).mockResolvedValue({
      data: { data: { id: '1', first_name: 'John', last_name: 'Doe' } },
      error: undefined,
      response: { status: 200 } as Response,
    } as any);
    mockRefreshUser.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      first_name: 'John',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRefreshUser).toHaveBeenCalled();
  });

  it('throws ApiError on 400 response', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.PATCH).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Validation failed' } },
      response: { status: 400 } as Response,
    } as any);

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      first_name: 'John',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(400);
    expect((result.current.error as ApiError).message).toBe('Validation failed');
  });

  it('does not call refreshUser on error', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.PATCH).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Server error' } },
      response: { status: 500 } as Response,
    } as any);

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      first_name: 'John',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockRefreshUser).not.toHaveBeenCalled();
  });
});
