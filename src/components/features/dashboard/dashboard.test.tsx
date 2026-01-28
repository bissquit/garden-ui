import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { ServicesTable } from './services-table';
import { GroupsTable } from './groups-table';
import { EventsTable } from './events-table';
import { EventTimeline } from './event-timeline';
import { EventDetailsCard } from './event-details-card';
import { EmptyState } from './empty-state';
import { Server } from 'lucide-react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/dashboard/services',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock data
const mockServices = [
  {
    id: '1',
    name: 'API',
    slug: 'api',
    description: 'Core API service',
    status: 'operational' as const,
    group_id: 'g1',
    order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Web Application',
    slug: 'web',
    description: 'Main web interface',
    status: 'degraded' as const,
    group_id: 'g1',
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
    description: 'Main application services',
    order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const mockEvents = [
  {
    id: 'e1',
    title: 'Web Application Performance Degradation',
    type: 'incident' as const,
    status: 'investigating' as const,
    severity: 'minor' as const,
    description: 'We are investigating reports of slow response times.',
    started_at: '2026-01-01T00:00:00Z',
    notify_subscribers: true,
    created_by: '1',
    service_ids: ['2'],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'e2',
    title: 'Database Maintenance',
    type: 'maintenance' as const,
    status: 'scheduled' as const,
    description: 'Scheduled database maintenance.',
    scheduled_start_at: '2026-01-02T00:00:00Z',
    scheduled_end_at: '2026-01-02T02:00:00Z',
    notify_subscribers: true,
    created_by: '1',
    service_ids: ['3'],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const mockEventUpdates = [
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
    created_at: '2026-01-01T01:00:00Z',
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

describe('ServicesTable', () => {
  it('renders services list', () => {
    renderWithProviders(
      <ServicesTable services={mockServices} groups={mockGroups} />
    );

    expect(screen.getByText('API')).toBeInTheDocument();
    expect(screen.getByText('Web Application')).toBeInTheDocument();
    expect(screen.getByText('api')).toBeInTheDocument();
    expect(screen.getByText('web')).toBeInTheDocument();
  });

  it('shows group names for services', () => {
    renderWithProviders(
      <ServicesTable services={mockServices} groups={mockGroups} />
    );

    // Both services belong to 'Core Services' group
    const groupCells = screen.getAllByText('Core Services');
    expect(groupCells.length).toBe(2);
  });

  it('shows status for each service', () => {
    renderWithProviders(
      <ServicesTable services={mockServices} groups={mockGroups} />
    );

    expect(screen.getByText('Operational')).toBeInTheDocument();
    expect(screen.getByText('Degraded Performance')).toBeInTheDocument();
  });

  it('renders empty state when no services', () => {
    renderWithProviders(<ServicesTable services={[]} groups={[]} />);

    expect(screen.getByText('No services')).toBeInTheDocument();
    expect(
      screen.getByText('No services have been created yet.')
    ).toBeInTheDocument();
  });
});

describe('GroupsTable', () => {
  it('renders groups list', () => {
    const serviceCount = new Map([['g1', 2]]);
    renderWithProviders(
      <GroupsTable groups={mockGroups} serviceCount={serviceCount} />
    );

    expect(screen.getByText('Core Services')).toBeInTheDocument();
    expect(screen.getByText('core')).toBeInTheDocument();
    expect(screen.getByText('Main application services')).toBeInTheDocument();
  });

  it('shows service count for each group', () => {
    const serviceCount = new Map([['g1', 2]]);
    renderWithProviders(
      <GroupsTable groups={mockGroups} serviceCount={serviceCount} />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders empty state when no groups', () => {
    renderWithProviders(<GroupsTable groups={[]} serviceCount={new Map()} />);

    expect(screen.getByText('No groups')).toBeInTheDocument();
  });
});

describe('EventsTable', () => {
  it('renders events list', () => {
    renderWithProviders(<EventsTable events={mockEvents} />);

    expect(
      screen.getByText('Web Application Performance Degradation')
    ).toBeInTheDocument();
    expect(screen.getByText('Database Maintenance')).toBeInTheDocument();
  });

  it('shows event type badges', () => {
    renderWithProviders(<EventsTable events={mockEvents} />);

    expect(screen.getByText('incident')).toBeInTheDocument();
    expect(screen.getByText('maintenance')).toBeInTheDocument();
  });

  it('shows severity for incidents', () => {
    renderWithProviders(<EventsTable events={mockEvents} />);

    expect(screen.getByText('Minor')).toBeInTheDocument();
  });

  it('renders empty state when no events', () => {
    renderWithProviders(<EventsTable events={[]} />);

    expect(screen.getByText('No events')).toBeInTheDocument();
    expect(
      screen.getByText('No events match the current filters.')
    ).toBeInTheDocument();
  });
});

describe('EventTimeline', () => {
  it('renders timeline updates', () => {
    renderWithProviders(<EventTimeline updates={mockEventUpdates} />);

    expect(screen.getByText('Looking into the issue.')).toBeInTheDocument();
    expect(screen.getByText('Found the root cause.')).toBeInTheDocument();
  });

  it('shows status labels for each update', () => {
    renderWithProviders(<EventTimeline updates={mockEventUpdates} />);

    expect(screen.getByText('Investigating')).toBeInTheDocument();
    expect(screen.getByText('Identified')).toBeInTheDocument();
  });

  it('renders empty message when no updates', () => {
    renderWithProviders(<EventTimeline updates={[]} />);

    expect(screen.getByText('No updates yet.')).toBeInTheDocument();
  });
});

describe('EventDetailsCard', () => {
  it('renders event details', () => {
    renderWithProviders(<EventDetailsCard event={mockEvents[0]} />);

    expect(
      screen.getByText('Web Application Performance Degradation')
    ).toBeInTheDocument();
    expect(
      screen.getByText('We are investigating reports of slow response times.')
    ).toBeInTheDocument();
  });

  it('shows event type and severity badges', () => {
    renderWithProviders(<EventDetailsCard event={mockEvents[0]} />);

    expect(screen.getByText('incident')).toBeInTheDocument();
    expect(screen.getByText('Minor')).toBeInTheDocument();
    expect(screen.getByText('Investigating')).toBeInTheDocument();
  });

  it('shows scheduled times for maintenance', () => {
    renderWithProviders(<EventDetailsCard event={mockEvents[1]} />);

    expect(screen.getByText('Scheduled Start')).toBeInTheDocument();
    expect(screen.getByText('Scheduled End')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders empty state with icon, title and description', () => {
    renderWithProviders(
      <EmptyState
        icon={Server}
        title="No items"
        description="There are no items to display."
      />
    );

    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(
      screen.getByText('There are no items to display.')
    ).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    renderWithProviders(
      <EmptyState
        icon={Server}
        title="No items"
        description="There are no items."
        action={<button>Add Item</button>}
      />
    );

    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });
});
