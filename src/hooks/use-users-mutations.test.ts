import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateUser, useUpdateUser, useAdminResetPassword } from './use-users-mutations';
import { type ReactNode, createElement } from 'react';

// Mock apiClient
vi.mock('@/api/client', () => ({
  apiClient: {
    POST: vi.fn(),
    PATCH: vi.fn(),
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

describe('useCreateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/v1/users with correct body', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: { data: { id: '1', email: 'new@example.com', role: 'user' } },
      error: undefined,
      response: { status: 201 } as Response,
    } as any);

    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: 'new@example.com',
      password: 'password123',
      role: 'user',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.POST).toHaveBeenCalledWith('/api/v1/users', {
      body: {
        email: 'new@example.com',
        password: 'password123',
        role: 'user',
      },
    });
  });

  it('throws error on 409 conflict (email exists)', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Email already exists' } },
      response: { status: 409 } as Response,
    } as any);

    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: 'existing@example.com',
      password: 'password123',
      role: 'user',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('A user with this email already exists');
  });

  it('throws error on 403 forbidden', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Forbidden' } },
      response: { status: 403 } as Response,
    } as any);

    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: 'new@example.com',
      password: 'password123',
      role: 'user',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Admin role required');
  });
});

describe('useUpdateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls PATCH /api/v1/users/{id} with correct body', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.PATCH).mockResolvedValue({
      data: { data: { id: '1', role: 'operator' } },
      error: undefined,
      response: { status: 200 } as Response,
    } as any);

    const { result } = renderHook(() => useUpdateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: '1',
      data: { role: 'operator', first_name: 'Updated' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.PATCH).toHaveBeenCalledWith('/api/v1/users/{id}', {
      params: { path: { id: '1' } },
      body: { role: 'operator', first_name: 'Updated' },
    });
  });

  it('throws error on 409 conflict (self-modification)', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.PATCH).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Cannot modify own account' } },
      response: { status: 409 } as Response,
    } as any);

    const { result } = renderHook(() => useUpdateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: '1',
      data: { role: 'user' },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Cannot modify your own account');
  });

  it('throws error on 403 forbidden', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.PATCH).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Forbidden' } },
      response: { status: 403 } as Response,
    } as any);

    const { result } = renderHook(() => useUpdateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: '1',
      data: { is_active: false },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Admin role required');
  });
});

describe('useAdminResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/v1/users/{id}/reset-password with correct body', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { status: 204 } as Response,
    } as any);

    const { result } = renderHook(() => useAdminResetPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: '1',
      data: { new_password: 'newpass123' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.POST).toHaveBeenCalledWith('/api/v1/users/{id}/reset-password', {
      params: { path: { id: '1' } },
      body: { new_password: 'newpass123' },
    });
  });

  it('returns successfully on 204 response', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { status: 204 } as Response,
    } as any);

    const { result } = renderHook(() => useAdminResetPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: '1',
      data: { new_password: 'newpass123' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.error).toBeNull();
  });

  it('throws error on 409 conflict (self-reset)', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Cannot reset own password' } },
      response: { status: 409 } as Response,
    } as any);

    const { result } = renderHook(() => useAdminResetPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: '1',
      data: { new_password: 'newpass123' },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Cannot reset your own password via this endpoint');
  });

  it('throws error on 403 forbidden', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Forbidden' } },
      response: { status: 403 } as Response,
    } as any);

    const { result } = renderHook(() => useAdminResetPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: '1',
      data: { new_password: 'newpass123' },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Admin role required');
  });
});
