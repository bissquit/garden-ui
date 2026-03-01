import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsersTable } from './users-table';
import type { components } from '@/api/types.generated';

type User = components['schemas']['User'];

const mockUsers: User[] = [
  {
    id: 'u1',
    email: 'admin@example.com',
    first_name: 'Alice',
    last_name: 'Admin',
    role: 'admin',
    is_active: true,
    must_change_password: false,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'u2',
    email: 'operator@example.com',
    first_name: 'Bob',
    last_name: 'Ops',
    role: 'operator',
    is_active: true,
    must_change_password: false,
    created_at: '2026-02-01T12:00:00Z',
    updated_at: '2026-02-01T12:00:00Z',
  },
  {
    id: 'u3',
    email: 'inactive@example.com',
    first_name: 'Charlie',
    last_name: 'Gone',
    role: 'user',
    is_active: false,
    must_change_password: false,
    created_at: '2026-03-01T08:00:00Z',
    updated_at: '2026-03-01T08:00:00Z',
  },
];

const defaultProps = {
  users: mockUsers,
  total: 3,
  limit: 10,
  offset: 0,
  currentUserId: 'u1',
  onPageChange: vi.fn(),
  onEdit: vi.fn(),
  onResetPassword: vi.fn(),
  onToggleActive: vi.fn(),
};

describe('UsersTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with user data', () => {
    render(<UsersTable {...defaultProps} />);

    // Emails
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('operator@example.com')).toBeInTheDocument();
    expect(screen.getByText('inactive@example.com')).toBeInTheDocument();

    // Names
    expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    expect(screen.getByText('Bob Ops')).toBeInTheDocument();
    expect(screen.getByText('Charlie Gone')).toBeInTheDocument();

    // Role badges
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('operator')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();

    // Status badges
    const activeBadges = screen.getAllByText('Active');
    expect(activeBadges).toHaveLength(2);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('shows "You" label instead of action buttons for current user', () => {
    render(<UsersTable {...defaultProps} />);

    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('shows Edit, Reset Password, Toggle Active buttons for other users', () => {
    render(<UsersTable {...defaultProps} />);

    const editButtons = screen.getAllByTestId('edit-user-button');
    const resetButtons = screen.getAllByTestId('reset-password-button');
    const toggleButtons = screen.getAllByTestId('toggle-active-button');

    // u2 and u3 are other users (not currentUserId)
    expect(editButtons).toHaveLength(2);
    expect(resetButtons).toHaveLength(2);
    expect(toggleButtons).toHaveLength(2);
  });

  it('inactive users have opacity-60 styling', () => {
    const { container } = render(<UsersTable {...defaultProps} />);

    const rows = container.querySelectorAll('tbody tr');
    // u3 (index 2) is inactive
    expect(rows[2].className).toContain('opacity-60');
    // u1 (index 0) is active
    expect(rows[0].className).not.toContain('opacity-60');
  });

  it('pagination shows "Showing X-Y of Z" text correctly', () => {
    render(<UsersTable {...defaultProps} />);

    expect(screen.getByText('Showing 1-3 of 3')).toBeInTheDocument();
  });

  it('Previous button is disabled on first page (offset=0)', () => {
    render(<UsersTable {...defaultProps} />);

    const prevButton = screen.getByTestId('prev-page-button');
    expect(prevButton).toBeDisabled();
  });

  it('Next button is disabled on last page', () => {
    render(<UsersTable {...defaultProps} />);

    const nextButton = screen.getByTestId('next-page-button');
    expect(nextButton).toBeDisabled();
  });

  it('clicking Next calls onPageChange with correct offset', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <UsersTable
        {...defaultProps}
        total={25}
        limit={10}
        offset={0}
        onPageChange={onPageChange}
      />
    );

    const nextButton = screen.getByTestId('next-page-button');
    await user.click(nextButton);

    expect(onPageChange).toHaveBeenCalledWith(10);
  });

  it('shows empty state when users array is empty', () => {
    render(
      <UsersTable
        {...defaultProps}
        users={[]}
        total={0}
      />
    );

    expect(screen.getByText('No users')).toBeInTheDocument();
    expect(
      screen.getByText('No users found matching the current filter.')
    ).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(<UsersTable {...defaultProps} onEdit={onEdit} />);

    const editButtons = screen.getAllByTestId('edit-user-button');
    await user.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledWith(mockUsers[1]);
  });

  it('calls onToggleActive when toggle button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleActive = vi.fn();

    render(<UsersTable {...defaultProps} onToggleActive={onToggleActive} />);

    const toggleButtons = screen.getAllByTestId('toggle-active-button');
    await user.click(toggleButtons[0]);

    expect(onToggleActive).toHaveBeenCalledWith(mockUsers[1]);
  });
});
