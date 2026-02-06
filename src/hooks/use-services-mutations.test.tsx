import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateService, useDeleteService, useRestoreService } from './use-services-mutations';
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

describe('useCreateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a service successfully', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: { data: { id: '1', name: 'Test Service' } },
      error: undefined,
      response: {} as Response,
    });

    const { result } = renderHook(() => useCreateService(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'Test Service',
      slug: 'test-service',
      order: 0,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.POST).toHaveBeenCalledWith('/api/v1/services', {
      body: { name: 'Test Service', slug: 'test-service', order: 0 },
    });
  });

  it('should handle error when creating service fails', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Service already exists' } },
      response: {} as Response,
    });

    const { result } = renderHook(() => useCreateService(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'Test Service',
      slug: 'test-service',
      order: 0,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useDeleteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete a service successfully', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.DELETE).mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { status: 200 } as Response,
    });

    const { result } = renderHook(() => useDeleteService(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('test-service');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.DELETE).toHaveBeenCalledWith('/api/v1/services/{slug}', {
      params: { path: { slug: 'test-service' } },
    });
  });

  it('should handle 409 conflict error with backend message', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.DELETE).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'cannot archive service: has active events' } },
      response: { status: 409 } as Response,
    });

    const { result } = renderHook(() => useDeleteService(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('test-service');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('cannot archive service: has active events');
  });
});

describe('useRestoreService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should restore a service successfully', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: { data: { id: '1', name: 'Test Service' } },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const { result } = renderHook(() => useRestoreService(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('test-service');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.POST).toHaveBeenCalledWith('/api/v1/services/{slug}/restore', {
      params: { path: { slug: 'test-service' } },
    });
  });

  it('should handle error when restoring service fails', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Service not found' } },
      response: { status: 404 } as Response,
    });

    const { result } = renderHook(() => useRestoreService(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('test-service');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Service not found');
  });
});
