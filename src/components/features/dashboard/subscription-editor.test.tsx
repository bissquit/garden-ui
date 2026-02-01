import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SubscriptionEditor } from './subscription-editor';

// Mock ResizeObserver for jsdom
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock hooks
const mockSubscription = {
  id: 'sub-1',
  user_id: 'user-1',
  service_ids: ['service-1'],
  created_at: '2024-01-01T00:00:00Z',
};

const mockServices = [
  {
    id: 'service-1',
    name: 'API Service',
    slug: 'api',
    description: 'Core API',
    status: 'operational' as const,
    group_ids: ['group-1'],
    order: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'service-2',
    name: 'Web App',
    slug: 'web',
    description: 'Web application',
    status: 'operational' as const,
    group_ids: ['group-1'],
    order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockGroups = [
  {
    id: 'group-1',
    name: 'Core Services',
    slug: 'core',
    order: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

vi.mock('@/hooks/use-subscriptions', () => ({
  useSubscription: () => ({
    data: mockSubscription,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/hooks/use-subscriptions-mutations', () => ({
  useUpdateSubscription: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteSubscription: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/hooks/use-public-status', () => ({
  useServices: () => ({
    data: mockServices,
    isLoading: false,
    isError: false,
  }),
  useGroups: () => ({
    data: mockGroups,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('SubscriptionEditor', () => {
  it('renders subscription editor with title', () => {
    renderWithProviders(<SubscriptionEditor />);

    expect(screen.getByText('Service Subscriptions')).toBeInTheDocument();
    expect(
      screen.getByText('Choose which services you want to receive notifications about.')
    ).toBeInTheDocument();
  });

  it('shows service count', () => {
    renderWithProviders(<SubscriptionEditor />);

    expect(screen.getByText('1 of 2 selected')).toBeInTheDocument();
  });

  it('renders services grouped by group', () => {
    renderWithProviders(<SubscriptionEditor />);

    expect(screen.getByText('Core Services')).toBeInTheDocument();
    expect(screen.getByText('API Service')).toBeInTheDocument();
    expect(screen.getByText('Web App')).toBeInTheDocument();
  });

  it('shows service descriptions', () => {
    renderWithProviders(<SubscriptionEditor />);

    expect(screen.getByText('Core API')).toBeInTheDocument();
    expect(screen.getByText('Web application')).toBeInTheDocument();
  });

  it('has Select All and Deselect All buttons', () => {
    renderWithProviders(<SubscriptionEditor />);

    expect(screen.getByText('Select All')).toBeInTheDocument();
    expect(screen.getByText('Deselect All')).toBeInTheDocument();
  });

  it('has Save Changes button', () => {
    renderWithProviders(<SubscriptionEditor />);

    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('shows checkbox for each service', () => {
    renderWithProviders(<SubscriptionEditor />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(2);
  });

  it('allows clicking on service to toggle selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SubscriptionEditor />);

    const webAppCheckbox = screen.getByRole('checkbox', { name: /Web App/i });
    expect(webAppCheckbox).not.toBeChecked();

    await user.click(webAppCheckbox);
    expect(webAppCheckbox).toBeChecked();
  });
});
