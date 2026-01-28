import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTemplates } from './use-templates';
import type { ReactNode } from 'react';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    GET: vi.fn(),
  },
}));

import { apiClient } from '@/api/client';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
}

const mockTemplates = [
  {
    id: 't1',
    slug: 'database-maintenance',
    type: 'maintenance',
    title_template: 'Database Maintenance',
    body_template: 'Scheduled database maintenance.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 't2',
    slug: 'api-outage',
    type: 'incident',
    title_template: 'API Outage',
    body_template: 'API service is experiencing issues.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('useTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches templates successfully', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: { data: mockTemplates },
      error: null,
    } as any);

    const { result } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTemplates);
    expect(apiClient.GET).toHaveBeenCalledWith('/api/v1/templates');
  });

  it('returns empty array when no templates', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: { data: [] },
      error: null,
    } as any);

    const { result } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('handles fetch error', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: null,
      error: { message: 'Unauthorized' },
    } as any);

    const { result } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
