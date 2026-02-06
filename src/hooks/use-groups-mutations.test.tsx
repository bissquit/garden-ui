import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateGroup, useDeleteGroup, useRestoreGroup } from './use-groups-mutations';
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

describe('useCreateGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a group successfully', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: { data: { id: 'g1', name: 'Test Group' } },
      error: undefined,
      response: {} as Response,
    });

    const { result } = renderHook(() => useCreateGroup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'Test Group',
      slug: 'test-group',
      order: 0,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.POST).toHaveBeenCalledWith('/api/v1/groups', {
      body: { name: 'Test Group', slug: 'test-group', order: 0 },
    });
  });
});

describe('useDeleteGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete a group successfully', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.DELETE).mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { status: 200 } as Response,
    });

    const { result } = renderHook(() => useDeleteGroup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('test-group');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.DELETE).toHaveBeenCalledWith('/api/v1/groups/{slug}', {
      params: { path: { slug: 'test-group' } },
    });
  });

  it('should handle 409 conflict error with backend message', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.DELETE).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'cannot archive group: has active events' } },
      response: { status: 409 } as Response,
    });

    const { result } = renderHook(() => useDeleteGroup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('test-group');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('cannot archive group: has active events');
  });
});

describe('useRestoreGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should restore a group successfully', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: { data: { id: 'g1', name: 'Test Group' } },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const { result } = renderHook(() => useRestoreGroup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('test-group');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.POST).toHaveBeenCalledWith('/api/v1/groups/{slug}/restore', {
      params: { path: { slug: 'test-group' } },
    });
  });
});
