import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangePasswordForm } from './change-password-form';

// Mock useChangePassword
const mockMutateAsync = vi.fn();
vi.mock('@/hooks/use-change-password', () => ({
  useChangePassword: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<ChangePasswordForm />);

    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /change password/i })
    ).toBeInTheDocument();
  });

  it('shows validation errors for empty fields on submit', async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText(/current password is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when new_password < 8 chars', async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText(/current password/i), 'oldpass123');
    await user.type(screen.getByLabelText(/new password/i), 'short');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/new password must be at least 8 characters/i)
      ).toBeInTheDocument();
    });
  });

  it('shows validation error when new_password === current_password', async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText(/current password/i), 'samepass123');
    await user.type(screen.getByLabelText(/new password/i), 'samepass123');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/new password must be different from current password/i)
      ).toBeInTheDocument();
    });
  });

  it('calls mutation on valid submit', async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<ChangePasswordForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/current password/i), 'oldpass123');
    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        current_password: 'oldpass123',
        new_password: 'newpass123',
      });
    });
  });

  it('shows API error in alert on failed mutation', async () => {
    const { ApiError } = await import('@/lib/api-error');
    mockMutateAsync.mockRejectedValueOnce(
      new ApiError(400, 'Current password is incorrect')
    );

    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText(/current password/i), 'wrongpass1');
    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/current password is incorrect/i)
      ).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    mockMutateAsync.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText(/current password/i), 'oldpass123');
    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(
      screen.getByRole('button', { name: /change password/i })
    ).toBeDisabled();
  });
});
