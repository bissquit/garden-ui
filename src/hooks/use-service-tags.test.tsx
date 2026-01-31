import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useServiceTags, useUpdateServiceTags } from './use-service-tags';
import type { ReactNode } from 'react';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    GET: vi.fn(),
    PUT: vi.fn(),
  },
}));

import { apiClient } from '@/api/client';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
}

describe('useServiceTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches service tags successfully', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: { data: { tags: { environment: 'production', team: 'platform' } } },
      error: null,
    } as any);

    const { result } = renderHook(() => useServiceTags('api-service'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      environment: 'production',
      team: 'platform',
    });
    expect(apiClient.GET).toHaveBeenCalledWith('/api/v1/services/{slug}/tags', {
      params: { path: { slug: 'api-service' } },
    });
  });

  it('returns empty object when no tags', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: { data: { tags: {} } },
      error: null,
    } as any);

    const { result } = renderHook(() => useServiceTags('api-service'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({});
  });

  it('handles fetch error', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: null,
      error: { error: { message: 'Not found' } },
    } as any);

    const { result } = renderHook(() => useServiceTags('api-service'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Not found');
  });

  it('does not fetch when slug is empty', async () => {
    renderHook(() => useServiceTags(''), {
      wrapper: createWrapper(),
    });

    expect(apiClient.GET).not.toHaveBeenCalled();
  });
});

describe('useUpdateServiceTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates service tags successfully', async () => {
    vi.mocked(apiClient.PUT).mockResolvedValueOnce({
      data: { data: { tags: { environment: 'staging' } } },
      error: null,
    } as any);

    const { result } = renderHook(() => useUpdateServiceTags(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      slug: 'api-service',
      tags: { environment: 'staging' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.PUT).toHaveBeenCalledWith('/api/v1/services/{slug}/tags', {
      params: { path: { slug: 'api-service' } },
      body: { tags: { environment: 'staging' } },
    });
  });

  it('handles error when updating tags fails', async () => {
    vi.mocked(apiClient.PUT).mockResolvedValueOnce({
      data: null,
      error: { error: { message: 'Service not found' } },
    } as any);

    const { result } = renderHook(() => useUpdateServiceTags(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      slug: 'api-service',
      tags: { environment: 'staging' },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Service not found');
  });
});
