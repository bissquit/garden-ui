import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEvents, useEvent, useEventUpdates, useEventServiceChanges } from './use-events';
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

const mockEvents = [
  {
    id: 'e1',
    title: 'Test Incident',
    type: 'incident',
    status: 'investigating',
    severity: 'minor',
    description: 'Test description',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'e2',
    title: 'Test Maintenance',
    type: 'maintenance',
    status: 'scheduled',
    severity: null,
    description: 'Maintenance description',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const mockEventUpdates = [
  {
    id: 'u1',
    event_id: 'e1',
    status: 'investigating',
    message: 'Looking into the issue',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u2',
    event_id: 'e1',
    status: 'identified',
    message: 'Found the root cause',
    created_at: '2026-01-01T01:00:00Z',
    updated_at: '2026-01-01T01:00:00Z',
  },
];

describe('useEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches events successfully', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: { data: mockEvents },
      error: null,
    } as any);

    const { result } = renderHook(() => useEvents(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockEvents);
    expect(apiClient.GET).toHaveBeenCalledWith('/api/v1/events', {
      params: { query: { type: undefined, status: undefined } },
    });
  });

  it('fetches events with filters', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: { data: [mockEvents[0]] },
      error: null,
    } as any);

    const { result } = renderHook(
      () => useEvents({ type: 'incident', status: 'investigating' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.GET).toHaveBeenCalledWith('/api/v1/events', {
      params: { query: { type: 'incident', status: 'investigating' } },
    });
  });

  it('handles fetch error', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: null,
      error: { message: 'Unauthorized' },
    } as any);

    const { result } = renderHook(() => useEvents(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches single event successfully', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: { data: mockEvents[0] },
      error: null,
    } as any);

    const { result } = renderHook(() => useEvent('e1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockEvents[0]);
    expect(apiClient.GET).toHaveBeenCalledWith('/api/v1/events/{id}', {
      params: { path: { id: 'e1' } },
    });
  });

  it('does not fetch when id is empty', async () => {
    const { result } = renderHook(() => useEvent(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(apiClient.GET).not.toHaveBeenCalled();
  });
});

describe('useEventUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches event updates successfully', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: { data: mockEventUpdates },
      error: null,
    } as any);

    const { result } = renderHook(() => useEventUpdates('e1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockEventUpdates);
    expect(apiClient.GET).toHaveBeenCalledWith('/api/v1/events/{id}/updates', {
      params: { path: { id: 'e1' } },
    });
  });

  it('does not fetch when eventId is empty', async () => {
    const { result } = renderHook(() => useEventUpdates(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(apiClient.GET).not.toHaveBeenCalled();
  });
});

const mockServiceChanges = [
  {
    id: 'c1',
    event_id: 'e1',
    service_id: 's1',
    action: 'added',
    reason: 'Service affected by incident',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c2',
    event_id: 'e1',
    service_id: 's2',
    action: 'removed',
    reason: 'Service recovered',
    created_at: '2026-01-01T01:00:00Z',
  },
];

describe('useEventServiceChanges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches event service changes successfully', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: { data: mockServiceChanges },
      error: null,
    } as any);

    const { result } = renderHook(() => useEventServiceChanges('e1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockServiceChanges);
    expect(apiClient.GET).toHaveBeenCalledWith('/api/v1/events/{id}/changes', {
      params: { path: { id: 'e1' } },
    });
  });

  it('does not fetch when eventId is empty', async () => {
    const { result } = renderHook(() => useEventServiceChanges(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(apiClient.GET).not.toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    } as any);

    const { result } = renderHook(() => useEventServiceChanges('e1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
