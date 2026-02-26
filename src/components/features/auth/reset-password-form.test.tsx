import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResetPasswordForm } from './reset-password-form';

// Mock useResetPassword
const mockMutateAsync = vi.fn();
vi.mock('@/hooks/use-auth-recovery', () => ({
  useResetPassword: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders password fields', () => {
    render(<ResetPasswordForm token="test-token" />);

    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /reset password/i })
    ).toBeInTheDocument();
  });

  it('shows validation error for short password', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm token="test-token" />);

    await user.type(screen.getByLabelText(/new password/i), 'short');
    await user.type(screen.getByLabelText(/confirm password/i), 'short');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument();
    });
  });

  it('shows validation error for non-matching passwords', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm token="test-token" />);

    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different1');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('calls mutation with token and new_password (not confirm_password)', async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<ResetPasswordForm token="test-token" onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        token: 'test-token',
        new_password: 'newpass123',
      });
    });
  });

  it('shows API error in alert on failed mutation', async () => {
    const { ApiError } = await import('@/lib/api-error');
    mockMutateAsync.mockRejectedValueOnce(
      new ApiError(400, 'Invalid or expired token')
    );

    const user = userEvent.setup();
    render(<ResetPasswordForm token="test-token" />);

    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    mockMutateAsync.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    const user = userEvent.setup();
    render(<ResetPasswordForm token="test-token" />);

    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(
      screen.getByRole('button', { name: /reset password/i })
    ).toBeDisabled();
  });
});
