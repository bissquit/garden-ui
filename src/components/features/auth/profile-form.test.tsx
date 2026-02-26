import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileForm } from './profile-form';
import type { User } from '@/types';

// Mock useUpdateProfile
const mockMutateAsync = vi.fn();
vi.mock('@/hooks/use-update-profile', () => ({
  useUpdateProfile: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'operator',
  is_active: true,
  must_change_password: false,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<ProfileForm user={mockUser} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /save profile/i })
    ).toBeInTheDocument();
  });

  it('pre-fills fields from user prop', () => {
    render(<ProfileForm user={mockUser} />);

    expect(screen.getByLabelText(/email/i)).toHaveValue('test@example.com');
    expect(screen.getByLabelText(/role/i)).toHaveValue('operator');
    expect(screen.getByLabelText(/first name/i)).toHaveValue('John');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe');
  });

  it('disables email and role inputs', () => {
    render(<ProfileForm user={mockUser} />);

    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/role/i)).toBeDisabled();
  });

  it('allows editing first_name and last_name', () => {
    render(<ProfileForm user={mockUser} />);

    expect(screen.getByLabelText(/first name/i)).not.toBeDisabled();
    expect(screen.getByLabelText(/last name/i)).not.toBeDisabled();
  });

  it('calls mutation on valid submit', async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<ProfileForm user={mockUser} onSuccess={onSuccess} />);

    await user.clear(screen.getByLabelText(/first name/i));
    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        first_name: 'Jane',
        last_name: 'Doe',
      });
    });
  });

  it('calls onSuccess after successful submit', async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<ProfileForm user={mockUser} onSuccess={onSuccess} />);

    await user.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows API error in alert on failed mutation', async () => {
    const { ApiError } = await import('@/lib/api-error');
    mockMutateAsync.mockRejectedValueOnce(
      new ApiError(400, 'Validation failed')
    );

    const user = userEvent.setup();
    render(<ProfileForm user={mockUser} />);

    await user.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/validation failed/i)
      ).toBeInTheDocument();
    });
  });

  it('shows generic error for non-API errors', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    render(<ProfileForm user={mockUser} />);

    await user.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/an unexpected error occurred/i)
      ).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    mockMutateAsync.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    const user = userEvent.setup();
    render(<ProfileForm user={mockUser} />);

    await user.click(screen.getByRole('button', { name: /save profile/i }));

    expect(
      screen.getByRole('button', { name: /save profile/i })
    ).toBeDisabled();
  });

  it('handles user without first_name and last_name', () => {
    const userWithoutNames: User = {
      ...mockUser,
      first_name: undefined,
      last_name: undefined,
    };
    render(<ProfileForm user={userWithoutNames} />);

    expect(screen.getByLabelText(/first name/i)).toHaveValue('');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('');
  });

  it('shows validation error for first_name exceeding 100 characters', async () => {
    const user = userEvent.setup();
    render(<ProfileForm user={mockUser} />);

    await user.clear(screen.getByLabelText(/first name/i));
    await user.type(screen.getByLabelText(/first name/i), 'a'.repeat(101));
    await user.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/first name must be at most 100 characters/i)
      ).toBeInTheDocument();
    });
  });
});
