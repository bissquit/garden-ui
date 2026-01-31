import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useServices,
  useGroups,
  usePublicStatus,
  useStatusHistory,
} from './use-public-status';
import type { ReactNode } from 'react';

// Mock publicClient
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

const mockServices = [
  { id: 's1', name: 'Service 1', slug: 'service-1', status: 'operational' },
  { id: 's2', name: 'Service 2', slug: 'service-2', status: 'degraded' },
];

const mockGroups = [
  { id: 'g1', name: 'Group 1', slug: 'group-1', order: 0 },
  { id: 'g2', name: 'Group 2', slug: 'group-2', order: 1 },
];

const mockEvents = [
  {
    id: 'e1',
    title: 'Test Incident',
    type: 'incident',
    status: 'investigating',
  },
];

describe('useServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches services successfully', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: { data: mockServices },
      error: null,
    } as any);

    const { result } = renderHook(() => useServices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockServices);
    expect(publicClient.GET).toHaveBeenCalledWith('/api/v1/services', {
      params: { query: { include_archived: undefined } },
    });
  });

  it('fetches services with includeArchived option', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: { data: mockServices },
      error: null,
    } as any);

    const { result } = renderHook(() => useServices({ includeArchived: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(publicClient.GET).toHaveBeenCalledWith('/api/v1/services', {
      params: { query: { include_archived: true } },
    });
  });

  it('handles fetch error', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: null,
      error: { message: 'Error' },
    } as any);

    const { result } = renderHook(() => useServices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches groups successfully', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: { data: mockGroups },
      error: null,
    } as any);

    const { result } = renderHook(() => useGroups(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockGroups);
    expect(publicClient.GET).toHaveBeenCalledWith('/api/v1/groups', {
      params: { query: { include_archived: undefined } },
    });
  });

  it('fetches groups with includeArchived option', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: { data: mockGroups },
      error: null,
    } as any);

    const { result } = renderHook(() => useGroups({ includeArchived: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(publicClient.GET).toHaveBeenCalledWith('/api/v1/groups', {
      params: { query: { include_archived: true } },
    });
  });

  it('handles fetch error', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: null,
      error: { message: 'Error' },
    } as any);

    const { result } = renderHook(() => useGroups(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('usePublicStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches public status successfully', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: { data: { events: mockEvents } },
      error: null,
    } as any);

    const { result } = renderHook(() => usePublicStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockEvents);
    expect(publicClient.GET).toHaveBeenCalledWith('/api/v1/status');
  });

  it('handles fetch error', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: null,
      error: { message: 'Error' },
    } as any);

    const { result } = renderHook(() => usePublicStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useStatusHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches status history successfully', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: { data: { events: mockEvents } },
      error: null,
    } as any);

    const { result } = renderHook(() => useStatusHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockEvents);
    expect(publicClient.GET).toHaveBeenCalledWith('/api/v1/status/history');
  });

  it('handles fetch error', async () => {
    vi.mocked(publicClient.GET).mockResolvedValueOnce({
      data: null,
      error: { message: 'Error' },
    } as any);

    const { result } = renderHook(() => useStatusHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
