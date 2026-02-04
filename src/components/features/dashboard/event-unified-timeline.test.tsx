import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EventUnifiedTimeline } from './event-unified-timeline';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    GET: vi.fn(),
  },
}));

import { apiClient } from '@/api/client';

const mockEvent = {
  id: 'e1',
  title: 'Database connectivity issues',
  type: 'incident' as const,
  status: 'investigating' as const,
  severity: 'major' as const,
  description: 'We are investigating reports of slow database queries.',
  notify_subscribers: true,
  created_by: '1',
  created_at: '2025-12-31T23:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockServices = [
  {
    id: 's1',
    name: 'API Service',
    slug: 'api',
    status: 'operational' as const,
    group_ids: ['g1'],
    order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 's2',
    name: 'Web App',
    slug: 'web',
    status: 'operational' as const,
    group_ids: ['g1'],
    order: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const mockGroups = [
  {
    id: 'g1',
    name: 'Core Services',
    slug: 'core',
    order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const mockUpdates = [
  {
    id: 'u1',
    event_id: 'e1',
    status: 'investigating' as const,
    message: 'Looking into the issue.',
    notify_subscribers: false,
    created_by: '1',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u2',
    event_id: 'e1',
    status: 'identified' as const,
    message: 'Found the root cause.',
    notify_subscribers: true,
    created_by: '1',
    created_at: '2026-01-01T02:00:00Z',
  },
];

const mockChanges = [
  {
    id: 'c1',
    event_id: 'e1',
    action: 'added' as const,
    service_id: 's1',
    created_by: '1',
    created_at: '2026-01-01T01:00:00Z',
  },
  {
    id: 'c2',
    event_id: 'e1',
    action: 'removed' as const,
    group_id: 'g1',
    reason: 'No longer affected',
    created_by: '1',
    created_at: '2026-01-01T03:00:00Z',
  },
];

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('EventUnifiedTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders status updates', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: { data: mockChanges },
      error: null,
    } as never);

    renderWithProviders(
      <EventUnifiedTimeline
        event={mockEvent}
        eventId="e1"
        updates={mockUpdates}
        services={mockServices}
        groups={mockGroups}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Looking into the issue.')).toBeInTheDocument();
    });
    expect(screen.getByText('Found the root cause.')).toBeInTheDocument();
  });

  it('shows status labels for updates', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: { data: mockChanges },
      error: null,
    } as never);

    renderWithProviders(
      <EventUnifiedTimeline
        event={mockEvent}
        eventId="e1"
        updates={mockUpdates}
        services={mockServices}
        groups={mockGroups}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Identified')).toBeInTheDocument();
    });
  });

  it('renders service changes', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: { data: mockChanges },
      error: null,
    } as never);

    renderWithProviders(
      <EventUnifiedTimeline
        event={mockEvent}
        eventId="e1"
        updates={[]}
        services={mockServices}
        groups={mockGroups}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Added service')).toBeInTheDocument();
    });
    expect(screen.getByText('"API Service"')).toBeInTheDocument();
    expect(screen.getByText('Removed group')).toBeInTheDocument();
    expect(screen.getByText('"Core Services"')).toBeInTheDocument();
  });

  it('shows reason for service changes when provided', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: { data: mockChanges },
      error: null,
    } as never);

    renderWithProviders(
      <EventUnifiedTimeline
        event={mockEvent}
        eventId="e1"
        updates={[]}
        services={mockServices}
        groups={mockGroups}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No longer affected')).toBeInTheDocument();
    });
  });

  it('sorts entries by date (newest first)', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: { data: mockChanges },
      error: null,
    } as never);

    const { container } = renderWithProviders(
      <EventUnifiedTimeline
        event={mockEvent}
        eventId="e1"
        updates={mockUpdates}
        services={mockServices}
        groups={mockGroups}
      />
    );

    // Wait for changes to load
    await waitFor(() => {
      expect(screen.getByText('Removed group')).toBeInTheDocument();
    });

    // Get all timeline entry headers (font-medium spans) in order
    const headers = container.querySelectorAll('.font-medium');

    // Expected order (newest first):
    // 03:00 - Removed group
    // 02:00 - Identified
    // 01:00 - Added service
    // 00:00 - Investigating
    // Event created (last)
    expect(headers[0]).toHaveTextContent('Removed group');
    expect(headers[1]).toHaveTextContent('Identified');
    expect(headers[2]).toHaveTextContent('Added service');
    expect(headers[3]).toHaveTextContent('Investigating');
    expect(headers[4]).toHaveTextContent('Event created');
  });

  it('renders loading state', () => {
    // Don't resolve the mock - it will stay loading
    vi.mocked(apiClient.GET).mockImplementation(() => new Promise(() => {}));

    const { container } = renderWithProviders(
      <EventUnifiedTimeline
        event={mockEvent}
        eventId="e1"
        updates={mockUpdates}
        services={mockServices}
        groups={mockGroups}
      />
    );

    // Should show skeleton loading state (animate-pulse class from Skeleton component)
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders error state', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: null,
      error: { message: 'Server error' },
    } as never);

    renderWithProviders(
      <EventUnifiedTimeline
        event={mockEvent}
        eventId="e1"
        updates={mockUpdates}
        services={mockServices}
        groups={mockGroups}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load timeline')).toBeInTheDocument();
    });
  });

  it('renders event created block', async () => {
    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: { data: [] },
      error: null,
    } as never);

    renderWithProviders(
      <EventUnifiedTimeline
        event={mockEvent}
        eventId="e1"
        updates={[]}
        services={mockServices}
        groups={mockGroups}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Event created')).toBeInTheDocument();
    });
    expect(screen.getByText(/Incident: Database connectivity issues/)).toBeInTheDocument();
    expect(screen.getByText(/Severity: Major/)).toBeInTheDocument();
    expect(screen.getByText(/Initial status: Investigating/)).toBeInTheDocument();
    expect(screen.getByText('We are investigating reports of slow database queries.')).toBeInTheDocument();
  });

  it('groups simultaneous service changes', async () => {
    const simultaneousChanges = [
      {
        id: 'c1',
        event_id: 'e1',
        action: 'added' as const,
        service_id: 's1',
        created_by: '1',
        created_at: '2026-01-01T01:00:00Z',
      },
      {
        id: 'c2',
        event_id: 'e1',
        action: 'added' as const,
        service_id: 's2',
        created_by: '1',
        created_at: '2026-01-01T01:00:00Z', // Same timestamp
      },
    ];

    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: { data: simultaneousChanges },
      error: null,
    } as never);

    renderWithProviders(
      <EventUnifiedTimeline
        event={mockEvent}
        eventId="e1"
        updates={[]}
        services={mockServices}
        groups={mockGroups}
      />
    );

    // Should show plural "services" and list items
    await waitFor(() => {
      expect(screen.getByText('Added services')).toBeInTheDocument();
    });
    expect(screen.getByText('API Service')).toBeInTheDocument();
    expect(screen.getByText('Web App')).toBeInTheDocument();
  });
});
