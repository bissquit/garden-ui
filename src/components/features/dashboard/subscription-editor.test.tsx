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
    it('shows empty message when no channels at all', () => {
      mockChannelsData = [];

      renderWithProviders(<SubscriptionEditor />);

      expect(screen.getByText(/no channels available/i)).toBeInTheDocument();
    });

    it('shows unverified channel in matrix with disabled checkboxes', () => {
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

      // Channel should be visible in the matrix
      expect(screen.getByText('test')).toBeInTheDocument();
      // Should show "Unverified" label
      expect(screen.getByText('Unverified')).toBeInTheDocument();
      // Checkboxes should be disabled
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeDisabled();
      });
    });

    it('shows disabled channel in matrix with disabled checkboxes', () => {
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

      // Channel should be visible in the matrix
      expect(screen.getByText('test')).toBeInTheDocument();
      // Should show "Disabled" label
      expect(screen.getByText('Disabled')).toBeInTheDocument();
      // Checkboxes should be disabled
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeDisabled();
      });
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
      // The order: [email-all, telegram-all, email-backend-group, email-svc1, email-svc2, email-other-group, email-svc3]
      // Since telegram has subscribe_to_all=true, its group/service rows show "—" not checkboxes
      // So checkboxes: 0=email-all, 1=telegram-all, 2=email-backend-group, 3=email-API Gateway, 4=email-Database, 5=email-other-group, 6=email-Web App
      const databaseCheckbox = checkboxes[4]; // Database for email channel

      // svc1 (API Gateway) is subscribed, svc2 (Database) is not
      expect(databaseCheckbox).not.toBeChecked();

      await user.click(databaseCheckbox);

      expect(databaseCheckbox).toBeChecked();
    });
  });

  describe('Search', () => {
    it('renders the search input with correct placeholder', async () => {
      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Search services...')
        ).toBeInTheDocument();
      });
    });

    it('filters services by partial name match', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        expect(screen.getByText('API Gateway')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search services...');
      await user.type(searchInput, 'Gateway');

      await waitFor(() => {
        expect(screen.getByText('API Gateway')).toBeInTheDocument();
        expect(screen.queryByText('Database')).not.toBeInTheDocument();
        expect(screen.queryByText('Web App')).not.toBeInTheDocument();
      });
    });

    it('performs case-insensitive matching', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        expect(screen.getByText('Database')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search services...');
      await user.type(searchInput, 'DATABASE');

      await waitFor(() => {
        expect(screen.getByText('Database')).toBeInTheDocument();
        expect(screen.queryByText('API Gateway')).not.toBeInTheDocument();
        expect(screen.queryByText('Web App')).not.toBeInTheDocument();
      });
    });

    it('shows empty message when no services match the search', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        expect(screen.getByText('API Gateway')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search services...');
      await user.type(searchInput, 'nonexistent-xyz');

      await waitFor(() => {
        expect(
          screen.getByText('No services match your search')
        ).toBeInTheDocument();
      });
    });

    it('keeps "All services" row visible during search', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        expect(screen.getByText('All services')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search services...');
      await user.type(searchInput, 'Gateway');

      await waitFor(() => {
        expect(screen.getByText('All services')).toBeInTheDocument();
      });
    });

    it('restores full service list when search is cleared', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        expect(screen.getByText('API Gateway')).toBeInTheDocument();
        expect(screen.getByText('Database')).toBeInTheDocument();
        expect(screen.getByText('Web App')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search services...');
      await user.type(searchInput, 'Gateway');

      await waitFor(() => {
        expect(screen.queryByText('Database')).not.toBeInTheDocument();
        expect(screen.queryByText('Web App')).not.toBeInTheDocument();
      });

      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByText('API Gateway')).toBeInTheDocument();
        expect(screen.getByText('Database')).toBeInTheDocument();
        expect(screen.getByText('Web App')).toBeInTheDocument();
      });
    });
  });

  describe('Group Checkbox', () => {
    it('selects all services in a group when group checkbox is clicked', async () => {
      const user = userEvent.setup();
      // Start with no services subscribed for email channel
      mockChannelsData = [
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
          subscribed_service_ids: [],
        },
      ];

      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        expect(screen.getByText('Backend')).toBeInTheDocument();
      });

      // With single channel: 0=email-all, 1=email-backend-group, 2=email-API Gateway, 3=email-Database, 4=email-other-group, 5=email-Web App
      const checkboxes = screen.getAllByRole('checkbox');
      const backendGroupCheckbox = checkboxes[1];
      const apiGatewayCheckbox = checkboxes[2];
      const databaseCheckbox = checkboxes[3];

      // Initially none checked
      expect(apiGatewayCheckbox).not.toBeChecked();
      expect(databaseCheckbox).not.toBeChecked();

      // Click the group checkbox
      await user.click(backendGroupCheckbox);

      // All services in group should now be checked
      await waitFor(() => {
        expect(apiGatewayCheckbox).toBeChecked();
        expect(databaseCheckbox).toBeChecked();
      });
    });

    it('deselects all services in a group when checked group checkbox is clicked', async () => {
      const user = userEvent.setup();
      // Start with both Backend services subscribed
      mockChannelsData = [
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
          subscribed_service_ids: ['svc1', 'svc2'],
        },
      ];

      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        expect(screen.getByText('Backend')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const backendGroupCheckbox = checkboxes[1];
      const apiGatewayCheckbox = checkboxes[2];
      const databaseCheckbox = checkboxes[3];

      // Initially all checked
      expect(apiGatewayCheckbox).toBeChecked();
      expect(databaseCheckbox).toBeChecked();
      expect(backendGroupCheckbox).toBeChecked();

      // Click the group checkbox to deselect all
      await user.click(backendGroupCheckbox);

      // All services in group should now be unchecked
      await waitFor(() => {
        expect(apiGatewayCheckbox).not.toBeChecked();
        expect(databaseCheckbox).not.toBeChecked();
      });
    });

    it('shows indeterminate state when some services in group are selected', async () => {
      // svc1 (API Gateway) is subscribed, svc2 (Database) is not — default mock data
      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        expect(screen.getByText('Backend')).toBeInTheDocument();
      });

      // Checkboxes: 0=email-all, 1=telegram-all, 2=email-backend-group, 3=email-API Gateway, 4=email-Database, 5=email-other-group, 6=email-Web App
      const checkboxes = screen.getAllByRole('checkbox');
      const backendGroupCheckbox = checkboxes[2];

      // Group checkbox should be indeterminate (svc1 checked, svc2 not)
      expect(backendGroupCheckbox).toHaveAttribute('data-state', 'indeterminate');
    });

    it('shows dash for group checkbox when subscribeToAll is active', async () => {
      renderWithProviders(<SubscriptionEditor />);

      await waitFor(() => {
        expect(screen.getByText('Backend')).toBeInTheDocument();
      });

      // Telegram channel (ch2) has subscribe_to_all = true
      // Its group rows show mdash instead of checkboxes
      // The mdash is rendered as "\u2014" (em dash) in text content for service rows
      // and as "&mdash;" (which renders as "\u2014") for group rows
      const dashes = screen.getAllByText('—');
      // There should be dashes for: Backend group + svc1 + svc2 + Other Services group + svc3 = 5
      expect(dashes.length).toBe(5);
    });

    it('disables group checkbox for non-interactive channels', async () => {
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

      await waitFor(() => {
        expect(screen.getByText('Backend')).toBeInTheDocument();
      });

      // All checkboxes should be disabled including group checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeDisabled();
      });
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
      await user.click(checkboxes[4]); // Toggle Database subscription

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
      await user.click(checkboxes[4]);

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
