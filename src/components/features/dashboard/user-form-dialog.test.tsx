import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserFormDialog } from './user-form-dialog';
import type { components } from '@/api/types.generated';

type User = components['schemas']['User'];

// Mock mutations
const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();

vi.mock('@/hooks/use-users-mutations', () => ({
  useCreateUser: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  }),
  useUpdateUser: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockUser: User = {
  id: 'u1',
  email: 'alice@example.com',
  first_name: 'Alice',
  last_name: 'Admin',
  role: 'operator',
  is_active: true,
  must_change_password: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('UserFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trigger button and opens dialog on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserFormDialog />);

    expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add user/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('shows "Create User" title when no user prop', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserFormDialog />);

    await user.click(screen.getByRole('button', { name: /add user/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /create user/i })
      ).toBeInTheDocument();
    });
  });

  it('shows "Edit User" title when user prop provided', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserFormDialog user={mockUser} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    await waitFor(() => {
      expect(screen.getByText('Edit User')).toBeInTheDocument();
    });
  });

  it('dialog closes after successful form submission', async () => {
    mockCreateMutateAsync.mockResolvedValueOnce({ data: { id: 'new-id' } });
    const user = userEvent.setup();
    renderWithProviders(<UserFormDialog />);

    await user.click(screen.getByRole('button', { name: /add user/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('user-email-input'), 'new@example.com');
    await user.type(screen.getByTestId('user-password-input'), 'password123');
    await user.click(screen.getByTestId('user-form-submit'));

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
