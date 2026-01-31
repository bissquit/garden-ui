import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCreateEvent,
  useAddEventUpdate,
  useDeleteEvent,
  useAddServicesToEvent,
  useRemoveServicesFromEvent,
} from './use-events-mutations';
import { type ReactNode } from 'react';

// Mock apiClient
vi.mock('@/api/client', () => ({
  apiClient: {
    POST: vi.fn(),
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

describe('useCreateEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an event successfully', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: { data: { id: 'e1', title: 'Test Incident' } },
      error: undefined,
      response: {} as Response,
    });

    const { result } = renderHook(() => useCreateEvent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      title: 'Test Incident',
      type: 'incident',
      status: 'investigating',
      severity: 'minor',
      description: 'Test description',
      notify_subscribers: false,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.POST).toHaveBeenCalledWith('/api/v1/events', {
      body: {
        title: 'Test Incident',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test description',
        notify_subscribers: false,
      },
    });
  });

  it('should handle error when creating event fails', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Event creation failed' } },
      response: {} as Response,
    });

    const { result } = renderHook(() => useCreateEvent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      title: 'Test Incident',
      type: 'incident',
      status: 'investigating',
      severity: 'minor',
      description: 'Test description',
      notify_subscribers: false,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useAddEventUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add event update successfully', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: { data: { id: 'u1', message: 'Update message' } },
      error: undefined,
      response: {} as Response,
    });

    const { result } = renderHook(() => useAddEventUpdate(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      eventId: 'e1',
      data: {
        status: 'monitoring',
        message: 'Update message',
        notify_subscribers: false,
      },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.POST).toHaveBeenCalledWith('/api/v1/events/{id}/updates', {
      params: { path: { id: 'e1' } },
      body: {
        status: 'monitoring',
        message: 'Update message',
        notify_subscribers: false,
      },
    });
  });

  it('should handle error when adding update fails', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Update failed' } },
      response: {} as Response,
    });

    const { result } = renderHook(() => useAddEventUpdate(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      eventId: 'e1',
      data: {
        status: 'monitoring',
        message: 'Update message',
        notify_subscribers: false,
      },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useDeleteEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete an event successfully', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.DELETE).mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { status: 200 } as Response,
    });

    const { result } = renderHook(() => useDeleteEvent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('e1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.DELETE).toHaveBeenCalledWith('/api/v1/events/{id}', {
      params: { path: { id: 'e1' } },
    });
  });

  it('should handle error when deleting event fails', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.DELETE).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Delete failed' } },
      response: { status: 500 } as Response,
    });

    const { result } = renderHook(() => useDeleteEvent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('e1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useAddServicesToEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add services to event successfully', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: { data: { message: 'Services added' } },
      error: undefined,
      response: {} as Response,
    });

    const { result } = renderHook(() => useAddServicesToEvent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      eventId: 'e1',
      data: {
        service_ids: ['s1', 's2'],
        group_ids: ['g1'],
        reason: 'Services affected by incident',
      },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.POST).toHaveBeenCalledWith('/api/v1/events/{id}/services', {
      params: { path: { id: 'e1' } },
      body: {
        service_ids: ['s1', 's2'],
        group_ids: ['g1'],
        reason: 'Services affected by incident',
      },
    });
  });

  it('should handle error when adding services fails', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Failed to add services' } },
      response: {} as Response,
    });

    const { result } = renderHook(() => useAddServicesToEvent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      eventId: 'e1',
      data: {
        service_ids: ['s1'],
        reason: 'Adding service',
      },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useRemoveServicesFromEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should remove services from event successfully', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.DELETE).mockResolvedValue({
      data: { data: { message: 'Services removed' } },
      error: undefined,
      response: {} as Response,
    });

    const { result } = renderHook(() => useRemoveServicesFromEvent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      eventId: 'e1',
      data: {
        service_ids: ['s1', 's2'],
        reason: 'Services recovered',
      },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.DELETE).toHaveBeenCalledWith('/api/v1/events/{id}/services', {
      params: { path: { id: 'e1' } },
      body: {
        service_ids: ['s1', 's2'],
        reason: 'Services recovered',
      },
    });
  });

  it('should handle error when removing services fails', async () => {
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.DELETE).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Failed to remove services' } },
      response: {} as Response,
    });

    const { result } = renderHook(() => useRemoveServicesFromEvent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      eventId: 'e1',
      data: {
        service_ids: ['s1'],
        reason: 'Removing service',
      },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
