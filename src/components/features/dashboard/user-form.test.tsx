import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserForm } from './user-form';
import type { components } from '@/api/types.generated';

type User = components['schemas']['User'];

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

describe('UserForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('create mode: renders Email, Password, First Name, Last Name, Role fields', () => {
    render(<UserForm onSubmit={vi.fn()} />);

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('First Name (optional)')).toBeInTheDocument();
    expect(screen.getByText('Last Name (optional)')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('create mode: email and password fields are visible', () => {
    render(<UserForm onSubmit={vi.fn()} />);

    expect(screen.getByTestId('user-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('user-password-input')).toBeInTheDocument();
  });

  it('edit mode: hides email and password fields', () => {
    render(<UserForm user={mockUser} onSubmit={vi.fn()} />);

    expect(screen.queryByTestId('user-email-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-password-input')).not.toBeInTheDocument();
  });

  it('edit mode: pre-fills first_name, last_name, role from user prop', () => {
    render(<UserForm user={mockUser} onSubmit={vi.fn()} />);

    expect(screen.getByTestId('user-first-name-input')).toHaveValue('Alice');
    expect(screen.getByTestId('user-last-name-input')).toHaveValue('Admin');
    // Role select shows the selected value
    expect(screen.getByTestId('user-role-select')).toHaveTextContent('Operator');
  });

  it('create mode: shows validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    render(<UserForm onSubmit={vi.fn()} />);

    await user.click(screen.getByTestId('user-form-submit'));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('create mode: shows validation error for short password', async () => {
    const user = userEvent.setup();
    render(<UserForm onSubmit={vi.fn()} />);

    await user.type(screen.getByTestId('user-email-input'), 'test@example.com');
    await user.type(screen.getByTestId('user-password-input'), 'short');
    await user.click(screen.getByTestId('user-form-submit'));

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument();
    });
  });

  it('calls onSubmit with correct data on valid submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<UserForm onSubmit={onSubmit} />);

    await user.type(screen.getByTestId('user-email-input'), 'new@example.com');
    await user.type(screen.getByTestId('user-password-input'), 'password123');
    await user.type(screen.getByTestId('user-first-name-input'), 'New');
    await user.type(screen.getByTestId('user-last-name-input'), 'User');
    await user.click(screen.getByTestId('user-form-submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    const callArgs = onSubmit.mock.calls[0][0];
    expect(callArgs).toEqual(
      expect.objectContaining({
        email: 'new@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User',
        role: 'user',
      })
    );
  });

  it('submit button shows "Create User" in create mode', () => {
    render(<UserForm onSubmit={vi.fn()} />);

    expect(screen.getByTestId('user-form-submit')).toHaveTextContent(
      'Create User'
    );
  });

  it('submit button shows "Update User" in edit mode', () => {
    render(<UserForm user={mockUser} onSubmit={vi.fn()} />);

    expect(screen.getByTestId('user-form-submit')).toHaveTextContent(
      'Update User'
    );
  });

  it('submit button is disabled when isLoading=true', () => {
    render(<UserForm onSubmit={vi.fn()} isLoading={true} />);

    expect(screen.getByTestId('user-form-submit')).toBeDisabled();
  });
});
