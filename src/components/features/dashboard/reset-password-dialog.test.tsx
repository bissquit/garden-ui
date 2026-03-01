import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResetPasswordDialog } from './reset-password-dialog';
import type { components } from '@/api/types.generated';

type User = components['schemas']['User'];

// Mock mutations
const mockResetMutateAsync = vi.fn();
let mockIsPending = false;

vi.mock('@/hooks/use-users-mutations', () => ({
  useAdminResetPassword: () => ({
    mutateAsync: mockResetMutateAsync,
    isPending: mockIsPending,
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

describe('ResetPasswordDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
  });

  it('renders dialog with user email in description', () => {
    renderWithProviders(
      <ResetPasswordDialog user={mockUser} open={true} onOpenChange={vi.fn()} />
    );

    expect(screen.getByText(/alice@example\.com/)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /reset password/i })
    ).toBeInTheDocument();
  });

  it('shows password input field', () => {
    renderWithProviders(
      <ResetPasswordDialog user={mockUser} open={true} onOpenChange={vi.fn()} />
    );

    expect(screen.getByTestId('reset-password-input')).toBeInTheDocument();
    expect(screen.getByText('New Password')).toBeInTheDocument();
  });

  it('shows validation error for short password', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ResetPasswordDialog user={mockUser} open={true} onOpenChange={vi.fn()} />
    );

    await user.type(screen.getByTestId('reset-password-input'), 'short');
    await user.click(screen.getByTestId('reset-password-submit'));

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument();
    });
  });

  it('calls mutation with correct password on valid submission', async () => {
    mockResetMutateAsync.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <ResetPasswordDialog
        user={mockUser}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    await user.type(screen.getByTestId('reset-password-input'), 'newpassword123');
    await user.click(screen.getByTestId('reset-password-submit'));

    await waitFor(() => {
      expect(mockResetMutateAsync).toHaveBeenCalledWith({
        id: 'u1',
        data: { new_password: 'newpassword123' },
      });
    });
  });

  it('Cancel button closes dialog', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <ResetPasswordDialog
        user={mockUser}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('submit button shows loading state when pending', () => {
    mockIsPending = true;
    renderWithProviders(
      <ResetPasswordDialog user={mockUser} open={true} onOpenChange={vi.fn()} />
    );

    expect(screen.getByTestId('reset-password-submit')).toBeDisabled();
  });

  it('form resets when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <ResetPasswordDialog
        user={mockUser}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    // Type a password
    await user.type(screen.getByTestId('reset-password-input'), 'somepassword');
    expect(screen.getByTestId('reset-password-input')).toHaveValue('somepassword');

    // Click cancel (which calls form.reset() and onOpenChange(false))
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // After cancel, form.reset() was called, so the field should be empty
    expect(screen.getByTestId('reset-password-input')).toHaveValue('');
  });
});
