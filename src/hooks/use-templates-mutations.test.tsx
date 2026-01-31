import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateTemplate, useDeleteTemplate } from './use-templates-mutations';
import type { ReactNode } from 'react';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    POST: vi.fn(),
    DELETE: vi.fn(),
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

describe('useCreateTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a template successfully', async () => {
    vi.mocked(apiClient.POST).mockResolvedValueOnce({
      data: {
        data: {
          id: 't1',
          slug: 'test-template',
          type: 'incident',
          title_template: 'Test',
          body_template: 'Body',
        },
      },
      error: null,
    } as any);

    const { result } = renderHook(() => useCreateTemplate(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      slug: 'test-template',
      type: 'incident',
      title_template: 'Test',
      body_template: 'Body',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.POST).toHaveBeenCalledWith('/api/v1/templates', {
      body: {
        slug: 'test-template',
        type: 'incident',
        title_template: 'Test',
        body_template: 'Body',
      },
    });
  });

  it('handles error when creating template fails', async () => {
    vi.mocked(apiClient.POST).mockResolvedValueOnce({
      data: null,
      error: { error: { message: 'Template already exists' } },
    } as any);

    const { result } = renderHook(() => useCreateTemplate(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      slug: 'test-template',
      type: 'incident',
      title_template: 'Test',
      body_template: 'Body',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Template already exists');
  });
});

describe('useDeleteTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a template successfully', async () => {
    vi.mocked(apiClient.DELETE).mockResolvedValueOnce({
      data: undefined,
      error: null,
    } as any);

    const { result } = renderHook(() => useDeleteTemplate(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('t1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.DELETE).toHaveBeenCalledWith('/api/v1/templates/{id}', {
      params: { path: { id: 't1' } },
    });
  });

  it('handles error when deleting template fails', async () => {
    vi.mocked(apiClient.DELETE).mockResolvedValueOnce({
      data: null,
      error: { error: { message: 'Template not found' } },
    } as any);

    const { result } = renderHook(() => useDeleteTemplate(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('t1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Template not found');
  });
});
