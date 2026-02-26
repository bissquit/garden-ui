import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUsers, useUser } from './use-users';
import { type ReactNode, createElement } from 'react';

// Mock apiClient
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

  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = 'TestWrapper';

  return Wrapper;
}

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches users list successfully', async () => {
    const { apiClient } = await import('@/api/client');
    const mockUsers = [
      { id: '1', email: 'admin@example.com', role: 'admin', is_active: true },
      { id: '2', email: 'user@example.com', role: 'user', is_active: true },
    ];

    vi.mocked(apiClient.GET).mockResolvedValue({
      data: { data: { users: mockUsers, total: 2, limit: 20, offset: 0 } },
      error: undefined,
      response: { status: 200 } as Response,
    } as any);

    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.users).toEqual(mockUsers);
    expect(result.current.data?.total).toBe(2);
    expect(result.current.data?.limit).toBe(20);
    expect(result.current.data?.offset).toBe(0);
  });

  it('passes query params correctly', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.GET).mockResolvedValue({
      data: { data: { users: [], total: 0, limit: 10, offset: 5 } },
      error: undefined,
      response: { status: 200 } as Response,
    } as any);

    const { result } = renderHook(
      () => useUsers({ role: 'admin', limit: 10, offset: 5 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.GET).toHaveBeenCalledWith('/api/v1/users', {
      params: {
        query: {
          role: 'admin',
          limit: 10,
          offset: 5,
        },
      },
    });
  });

  it('throws error on API failure', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.GET).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Forbidden' } },
      response: { status: 403 } as Response,
    } as any);

    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Failed to fetch users');
  });

  it('returns empty arrays when data is undefined', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.GET).mockResolvedValue({
      data: { data: undefined },
      error: undefined,
      response: { status: 200 } as Response,
    } as any);

    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.users).toEqual([]);
    expect(result.current.data?.total).toBe(0);
  });
});

describe('useUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches a single user by ID', async () => {
    const { apiClient } = await import('@/api/client');
    const mockUser = { id: '1', email: 'admin@example.com', role: 'admin', is_active: true };

    vi.mocked(apiClient.GET).mockResolvedValue({
      data: { data: mockUser },
      error: undefined,
      response: { status: 200 } as Response,
    } as any);

    const { result } = renderHook(() => useUser('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUser);

    expect(apiClient.GET).toHaveBeenCalledWith('/api/v1/users/{id}', {
      params: { path: { id: '1' } },
    });
  });

  it('does not fetch when id is empty', async () => {
    const { apiClient } = await import('@/api/client');

    renderHook(() => useUser(''), {
      wrapper: createWrapper(),
    });

    expect(apiClient.GET).not.toHaveBeenCalled();
  });

  it('throws error on API failure', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.GET).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Not found' } },
      response: { status: 404 } as Response,
    } as any);

    const { result } = renderHook(() => useUser('999'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Failed to fetch user');
  });
});
