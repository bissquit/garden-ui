import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StatusPage from '@/app/(public)/page';
import HistoryPage from '@/app/(public)/history/page';
import type { components } from '@/api/types.generated';

type Service = components['schemas']['Service'];
type ServiceGroup = components['schemas']['ServiceGroup'];
type Event = components['schemas']['Event'];

// Mock data
const mockServices: Service[] = [
  {
    id: '1',
    name: 'API',
    slug: 'api',
    description: 'Core API service',
    status: 'operational',
    effective_status: 'operational',
    has_active_events: false,
    group_ids: ['g1'],
    order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Web Application',
    slug: 'web',
    description: 'Main web interface',
    status: 'degraded',
    effective_status: 'degraded',
    has_active_events: true,
    group_ids: ['g1'],
    order: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const mockGroups: ServiceGroup[] = [
  {
    id: 'g1',
    name: 'Core Services',
    slug: 'core',
    service_ids: ['1', '2'],
    order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const mockActiveEvents: Event[] = [
  {
    id: 'e1',
    title: 'API Degradation',
    type: 'incident',
    status: 'investigating',
    severity: 'minor',
    description: 'Investigating API issues',
    started_at: '2026-01-27T10:00:00Z',
    resolved_at: null,
    scheduled_start_at: null,
    scheduled_end_at: null,
    notify_subscribers: true,
    template_id: null,
    created_by: '1',
    service_ids: ['2'],
    created_at: '2026-01-27T10:00:00Z',
    updated_at: '2026-01-27T10:00:00Z',
  },
];

const mockHistoryEvents: Event[] = [
  {
    id: 'h1',
    title: 'Past Incident',
    type: 'incident',
    status: 'resolved',
    severity: 'major',
    description: 'This incident has been resolved.',
    started_at: '2026-01-25T08:00:00Z',
    resolved_at: '2026-01-25T10:00:00Z',
    scheduled_start_at: null,
    scheduled_end_at: null,
    notify_subscribers: true,
    template_id: null,
    created_by: '1',
    service_ids: ['1'],
    created_at: '2026-01-25T08:00:00Z',
    updated_at: '2026-01-25T10:00:00Z',
  },
];

// Mock the hooks
const mockUseStatusPageData = vi.fn();
const mockUseStatusHistory = vi.fn();

vi.mock('@/hooks/use-public-status', () => ({
  useStatusPageData: () => mockUseStatusPageData(),
  useStatusHistory: () => mockUseStatusHistory(),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('StatusPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default successful response
    mockUseStatusPageData.mockReturnValue({
      services: mockServices,
      groups: mockGroups,
      events: mockActiveEvents,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('renders loading state', () => {
    mockUseStatusPageData.mockReturnValue({
      services: undefined,
      groups: undefined,
      events: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<StatusPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders services after loading', async () => {
    renderWithProviders(<StatusPage />);

    expect(screen.getByText('API')).toBeInTheDocument();
    expect(screen.getByText('Web Application')).toBeInTheDocument();
  });

  it('renders service group header', () => {
    renderWithProviders(<StatusPage />);

    expect(screen.getByText('Core Services')).toBeInTheDocument();
  });

  it('renders active incidents section', () => {
    renderWithProviders(<StatusPage />);

    expect(screen.getByText('Active Incidents')).toBeInTheDocument();
    expect(screen.getByText('API Degradation')).toBeInTheDocument();
  });

  it('renders overall status banner with degraded status', () => {
    renderWithProviders(<StatusPage />);

    expect(screen.getByText('Degraded System Performance')).toBeInTheDocument();
  });

  it('renders overall status banner with operational status', () => {
    mockUseStatusPageData.mockReturnValue({
      services: [{ ...mockServices[0], status: 'operational' }],
      groups: mockGroups,
      events: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<StatusPage />);

    expect(screen.getByText('All Systems Operational')).toBeInTheDocument();
  });

  it('displays service status labels', () => {
    renderWithProviders(<StatusPage />);

    expect(screen.getByText('Operational')).toBeInTheDocument();
    expect(screen.getByText('Degraded Performance')).toBeInTheDocument();
  });

  it('renders refresh button', () => {
    renderWithProviders(<StatusPage />);

    expect(
      screen.getByRole('button', { name: /refresh/i })
    ).toBeInTheDocument();
  });

  it('handles error state', () => {
    mockUseStatusPageData.mockReturnValue({
      services: undefined,
      groups: undefined,
      events: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch'),
      refetch: vi.fn(),
    });

    renderWithProviders(<StatusPage />);

    expect(screen.getByText('Failed to load status data.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('calls refetch on retry button click', async () => {
    const mockRefetch = vi.fn();
    mockUseStatusPageData.mockReturnValue({
      services: undefined,
      groups: undefined,
      events: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithProviders(<StatusPage />);

    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('shows severity badge for incidents', () => {
    renderWithProviders(<StatusPage />);

    expect(screen.getByText('Minor')).toBeInTheDocument();
  });

  it('shows empty state when no services', () => {
    mockUseStatusPageData.mockReturnValue({
      services: [],
      groups: [],
      events: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<StatusPage />);

    expect(screen.getByText('No services configured yet.')).toBeInTheDocument();
  });

  it('does not show incidents section when no active incidents', () => {
    mockUseStatusPageData.mockReturnValue({
      services: mockServices,
      groups: mockGroups,
      events: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<StatusPage />);

    expect(screen.queryByText('Active Incidents')).not.toBeInTheDocument();
  });
});

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseStatusHistory.mockReturnValue({
      data: mockHistoryEvents,
      isLoading: false,
      isError: false,
    });
  });

  it('renders loading state', () => {
    mockUseStatusHistory.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    renderWithProviders(<HistoryPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders history events after loading', () => {
    renderWithProviders(<HistoryPage />);

    expect(screen.getByText('Past Incident')).toBeInTheDocument();
  });

  it('renders page title', () => {
    renderWithProviders(<HistoryPage />);

    expect(screen.getByText('Incident History')).toBeInTheDocument();
  });

  it('renders back link', () => {
    renderWithProviders(<HistoryPage />);

    expect(
      screen.getByRole('link', { name: /back to current status/i })
    ).toBeInTheDocument();
  });

  it('shows resolved event status', () => {
    renderWithProviders(<HistoryPage />);

    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('handles empty history', () => {
    mockUseStatusHistory.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<HistoryPage />);

    expect(screen.getByText('No events in history.')).toBeInTheDocument();
  });

  it('handles error state', () => {
    mockUseStatusHistory.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    renderWithProviders(<HistoryPage />);

    expect(screen.getByText('Failed to load history.')).toBeInTheDocument();
  });
});
