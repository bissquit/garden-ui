import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  usePublicEvent,
  usePublicEventUpdates,
  usePublicEventChanges,
} from './use-public-events';
import type { ReactNode } from 'react';

vi.mock('@/api/client', () => ({
  publicClient: {
    GET: vi.fn(),
  },
}));

import { publicClient } from '@/api/client';

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

const mockEvent = {
  id: 'e1',
  title: 'Test Incident',
  type: 'incident' as const,
  status: 'investigating' as const,
  severity: 'major' as const,
  description: 'Test description',
  notify_subscribers: true,
  created_by: '1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockUpdates = [
  {
    id: 'u1',
    event_id: 'e1',
    status: 'investigating' as const,
    message: 'Looking into it',
    notify_subscribers: false,
    created_by: '1',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u2',
    event_id: 'e1',
    status: 'identified' as const,
    message: 'Found the issue',
    notify_subscribers: true,
    created_by: '1',
    created_at: '2026-01-01T01:00:00Z',
  },
];

const mockChanges = [
  {
    id: 'c1',
    event_id: 'e1',
    action: 'added' as const,
    service_id: 's1',
    created_by: '1',
    created_at: '2026-01-01T00:30:00Z',
  },
];

describe('usePublicEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches event successfully', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: { data: mockEvent },
      error: null,
    } as never);

    const { result } = renderHook(() => usePublicEvent('e1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockEvent);
    expect(publicClient.GET).toHaveBeenCalledWith('/api/v1/events/{id}', {
      params: { path: { id: 'e1' } },
    });
  });

  it('handles fetch error', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: null,
      error: { message: 'Server error' },
    } as never);

    const { result } = renderHook(() => usePublicEvent('e1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to fetch event');
  });

  it('handles not found (empty data)', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: { data: null },
      error: null,
    } as never);

    const { result } = renderHook(() => usePublicEvent('non-existent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Event not found');
  });

  it('does not fetch when id is empty', async () => {
    const { result } = renderHook(() => usePublicEvent(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(publicClient.GET).not.toHaveBeenCalled();
  });
});

describe('usePublicEventUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches updates successfully', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: { data: mockUpdates },
      error: null,
    } as never);

    const { result } = renderHook(() => usePublicEventUpdates('e1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUpdates);
    expect(publicClient.GET).toHaveBeenCalledWith('/api/v1/events/{id}/updates', {
      params: { path: { id: 'e1' } },
    });
  });

  it('returns empty array when no updates', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: { data: [] },
      error: null,
    } as never);

    const { result } = renderHook(() => usePublicEventUpdates('e1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('handles fetch error', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: null,
      error: { message: 'Server error' },
    } as never);

    const { result } = renderHook(() => usePublicEventUpdates('e1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to fetch event updates');
  });
});

describe('usePublicEventChanges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches changes successfully', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: { data: mockChanges },
      error: null,
    } as never);

    const { result } = renderHook(() => usePublicEventChanges('e1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockChanges);
    expect(publicClient.GET).toHaveBeenCalledWith('/api/v1/events/{id}/changes', {
      params: { path: { id: 'e1' } },
    });
  });

  it('returns empty array when no changes', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: { data: [] },
      error: null,
    } as never);

    const { result } = renderHook(() => usePublicEventChanges('e1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('handles fetch error', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: null,
      error: { message: 'Server error' },
    } as never);

    const { result } = renderHook(() => usePublicEventChanges('e1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to fetch service changes');
  });
});
