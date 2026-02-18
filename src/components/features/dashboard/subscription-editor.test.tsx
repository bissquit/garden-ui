import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SubscriptionEditor } from './subscription-editor';

// Mock hooks
const mockSetSubscriptionsMutate = vi.fn();
let mockChannelsData: ReturnType<typeof createMockChannelsData> | undefined;
let mockServicesData: ReturnType<typeof createMockServicesData> | undefined;
let mockGroupsData: ReturnType<typeof createMockGroupsData> | undefined;
let mockChannelsLoading = false;
let mockChannelsError = false;
let mockServicesLoading = false;

function createMockChannelsData() {
  return [
    {
      channel: {
        id: 'ch1',
        user_id: 'user-1',
        type: 'email' as const,
        target: 'test@example.com',
        is_enabled: true,
        is_verified: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      subscribe_to_all_services: false,
      subscribed_service_ids: ['svc1'],
    },
    {
      channel: {
        id: 'ch2',
        user_id: 'user-1',
        type: 'telegram' as const,
        target: 'john_doe',
        is_enabled: true,
        is_verified: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      subscribe_to_all_services: true,
      subscribed_service_ids: [],
    },
  ];
}

function createMockServicesData() {
  return [
    {
      id: 'svc1',
      name: 'API Gateway',
      slug: 'api-gateway',
      description: 'Main API',
      status: 'operational' as const,
      effective_status: 'operational' as const,
      has_active_events: false,
      group_ids: ['grp1'],
      order: 1,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'svc2',
      name: 'Database',
      slug: 'database',
      status: 'operational' as const,
      effective_status: 'operational' as const,
      has_active_events: false,
      group_ids: ['grp1'],
      order: 2,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'svc3',
      name: 'Web App',
      slug: 'web-app',
      status: 'operational' as const,
      effective_status: 'operational' as const,
      has_active_events: false,
      group_ids: [],
      order: 3,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ];
}

function createMockGroupsData() {
  return [
    {
      id: 'grp1',
      name: 'Backend',
      slug: 'backend',
      service_ids: ['svc1', 'svc2'],
      order: 1,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ];
}

vi.mock('@/hooks/use-subscriptions', () => ({
  useSubscriptionsMatrix: () => ({
    data: mockChannelsData,
    isLoading: mockChannelsLoading,
    isError: mockChannelsError,
  }),
}));

vi.mock('@/hooks/use-subscriptions-mutations', () => ({
  useSetChannelSubscriptions: () => ({
    mutateAsync: mockSetSubscriptionsMutate,
    isPending: false,
  }),
}));

vi.mock('@/hooks/use-public-status', () => ({
  useServices: () => ({
    data: mockServicesData,
    isLoading: mockServicesLoading,
  }),
  useGroups: () => ({
    data: mockGroupsData,
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
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetSubscriptionsMutate.mockReset();
    mockChannelsData = createMockChannelsData();
    mockServicesData = createMockServicesData();
    mockGroupsData = createMockGroupsData();
    mockChannelsLoading = false;
    mockChannelsError = false;
    mockServicesLoading = false;
  });

  describe('Loading State', () => {
    it('shows loading spinner when channels are loading', () => {
      mockChannelsLoading = true;
      mockChannelsData = undefined;

      renderWithProviders(<SubscriptionEditor />);

      // Should find animated loader
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows loading spinner when services are loading', () => {
      mockServicesLoading = true;
      mockServicesData = undefined;

      renderWithProviders(<SubscriptionEditor />);

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error state when channels fail to load', () => {
      mockChannelsError = true;
      mockChannelsData = undefined;

      renderWithProviders(<SubscriptionEditor />);

      expect(screen.getByText(/failed to load subscriptions/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows message when no verified channels', () => {
      mockChannelsData = [
        {
          channel: {
            id: 'ch1',
            user_id: 'user-1',
            type: 'email' as const,
            target: 'test@example.com',
            is_enabled: true,
            is_verified: false, // Not verified
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
          subscribe_to_all_services: false,
          subscribed_service_ids: [],
        },
      ];

      renderWithProviders(<SubscriptionEditor />);

      expect(screen.getByText(/no verified channels/i)).toBeInTheDocument();
    });

    it('shows message when no enabled channels', () => {
      mockChannelsData = [
        {
          channel: {
            id: 'ch1',
            user_id: 'user-1',
            type: 'email' as const,
            target: 'test@example.com',
            is_enabled: false, // Not enabled
            is_verified: true,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
          subscribe_to_all_services: false,
          subscribed_service_ids: [],
        },
      ];

      renderWithProviders(<SubscriptionEditor />);

      expect(screen.getByText(/no verified channels/i)).toBeInTheDocument();
    });
  });

  describe('Matrix View', () => {
    it('renders channel columns for verified and enabled channels', async () => {
      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        // Email channel shows truncated username
        expect(screen.getByText('test')).toBeInTheDocument();
        // Telegram channel shows username
        expect(screen.getByText('john_doe')).toBeInTheDocument();
      });
    });

    it('renders service rows grouped by groups', async () => {
      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        // Group header
        expect(screen.getByText('Backend')).toBeInTheDocument();
        // Services in group
        expect(screen.getByText('API Gateway')).toBeInTheDocument();
        expect(screen.getByText('Database')).toBeInTheDocument();
        // Ungrouped services
        expect(screen.getByText('Other Services')).toBeInTheDocument();
        expect(screen.getByText('Web App')).toBeInTheDocument();
      });
    });

    it('renders "All services" row', async () => {
      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        expect(screen.getByText('All services')).toBeInTheDocument();
        expect(screen.getByText('Including future services')).toBeInTheDocument();
      });
    });
  });

  describe('Subscribe to All', () => {
    it('shows dash for services when subscribe_to_all is true', async () => {
      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        // Telegram channel has subscribe_to_all = true
        // So service cells for that channel show "—"
        const dashes = screen.getAllByText('—');
        expect(dashes.length).toBeGreaterThan(0);
      });
    });

    it('toggles subscribe_to_all when clicking All services checkbox', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        expect(screen.getByText('All services')).toBeInTheDocument();
      });

      // Find checkboxes in the "All services" row
      const allCheckboxes = screen.getAllByRole('checkbox');
      // First checkbox should be for "All services" row, first channel (email)
      const emailAllServicesCheckbox = allCheckboxes[0];

      // Initially unchecked (email channel has subscribe_to_all = false)
      expect(emailAllServicesCheckbox).not.toBeChecked();

      await user.click(emailAllServicesCheckbox);

      // Now checked
      expect(emailAllServicesCheckbox).toBeChecked();
    });
  });

  describe('Individual Services', () => {
    it('shows checkbox for services when subscribe_to_all is false', async () => {
      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        // Email channel has subscribe_to_all = false, so checkboxes are shown
        // Get all checkboxes - should include service checkboxes
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(2); // More than just "All services" row
      });
    });

    it('toggles service subscription when clicking checkbox', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        expect(screen.getByText('Database')).toBeInTheDocument();
      });

      // Get all checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      // Find a service checkbox (not in "All services" row)
      // The order: [email-all, telegram-all, email-svc1, email-svc2, email-svc3, ...]
      // Since telegram has subscribe_to_all=true, its service rows show "—" not checkboxes
      // So checkboxes: 0=email-all, 1=telegram-all, 2=email-API Gateway, 3=email-Database, 4=email-Web App
      const databaseCheckbox = checkboxes[3]; // Database for email channel

      // svc1 (API Gateway) is subscribed, svc2 (Database) is not
      expect(databaseCheckbox).not.toBeChecked();

      await user.click(databaseCheckbox);

      expect(databaseCheckbox).toBeChecked();
    });
  });

  describe('Save', () => {
    it('disables save button when no changes made', async () => {
      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save changes/i });
        expect(saveButton).toBeDisabled();
      });
    });

    it('enables save button when changes are made', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        expect(screen.getByText('All services')).toBeInTheDocument();
      });

      // Make a change
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[3]); // Toggle Database subscription

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('calls mutation for each dirty channel when saving', async () => {
      const user = userEvent.setup();
      mockSetSubscriptionsMutate.mockResolvedValue({});

      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        expect(screen.getByText('All services')).toBeInTheDocument();
      });

      // Toggle Database subscription for email channel
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[3]);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockSetSubscriptionsMutate).toHaveBeenCalledWith({
          channelId: 'ch1',
          data: {
            subscribe_to_all_services: false,
            service_ids: ['svc1', 'svc2'], // Now includes Database
          },
        });
      });
    });

    it('clears service_ids when subscribe_to_all is set', async () => {
      const user = userEvent.setup();
      mockSetSubscriptionsMutate.mockResolvedValue({});

      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        expect(screen.getByText('All services')).toBeInTheDocument();
      });

      // Toggle "All services" for email channel
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Email "All services" checkbox

      // Click save
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockSetSubscriptionsMutate).toHaveBeenCalledWith({
          channelId: 'ch1',
          data: {
            subscribe_to_all_services: true,
            service_ids: [], // Cleared when subscribe_to_all is true
          },
        });
      });
    });
  });
});
