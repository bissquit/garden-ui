import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChannelsTable } from './channels-table';
import { ChannelForm } from './channel-form';

// Mock hooks
vi.mock('@/hooks/use-channels-mutations', () => ({
  useDeleteChannel: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateChannel: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useVerifyChannel: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCreateChannel: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockChannels = [
  {
    id: 'ch1',
    user_id: 'user-1',
    type: 'email' as const,
    target: 'test@example.com',
    is_enabled: true,
    is_verified: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ch2',
    user_id: 'user-1',
    type: 'telegram' as const,
    target: 'john_doe',
    is_enabled: false,
    is_verified: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
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

describe('ChannelsTable', () => {
  it('renders channels list', () => {
    renderWithProviders(<ChannelsTable channels={mockChannels} />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('john_doe')).toBeInTheDocument();
  });

  it('shows channel types', () => {
    renderWithProviders(<ChannelsTable channels={mockChannels} />);

    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByText('telegram')).toBeInTheDocument();
  });

  it('shows enabled/disabled status', () => {
    renderWithProviders(<ChannelsTable channels={mockChannels} />);

    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('shows verified/unverified status', () => {
    renderWithProviders(<ChannelsTable channels={mockChannels} />);

    // "Verified" appears in header and as status text, so use getAllByText
    const verifiedElements = screen.getAllByText('Verified');
    expect(verifiedElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Unverified')).toBeInTheDocument();
  });

  it('renders empty state when no channels', () => {
    renderWithProviders(<ChannelsTable channels={[]} />);

    expect(screen.getByText('No notification channels')).toBeInTheDocument();
    expect(
      screen.getByText('Add an email or Telegram channel to receive notifications.')
    ).toBeInTheDocument();
  });
});

describe('ChannelForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with type selector and target input', () => {
    const onSubmit = vi.fn();
    renderWithProviders(<ChannelForm onSubmit={onSubmit} />);

    expect(screen.getByText('Channel Type')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email address')).toBeInTheDocument();
    expect(screen.getByText('Add Channel')).toBeInTheDocument();
  });

  it('allows typing in target input', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(<ChannelForm onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText('Enter email address');
    await user.type(input, 'test@example.com');

    expect(input).toHaveValue('test@example.com');
  });

  // Note: Form submission and validation tests are covered by E2E tests
  // due to react-hook-form + jsdom compatibility limitations

  // Note: Select component interaction tests are skipped due to Radix UI + jsdom compatibility issues
  // The Select functionality is tested via E2E tests instead

  it('shows loading state when isLoading is true', () => {
    const onSubmit = vi.fn();
    renderWithProviders(<ChannelForm onSubmit={onSubmit} isLoading />);

    const submitButton = screen.getByText('Add Channel');
    expect(submitButton).toBeDisabled();
  });
});
