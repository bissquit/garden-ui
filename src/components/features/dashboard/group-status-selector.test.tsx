import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GroupStatusSelector } from './group-status-selector';

describe('GroupStatusSelector', () => {
  const defaultProps = {
    groupId: 'grp-1',
    groupName: 'Backend Services',
    serviceCount: 5,
    selected: false,
    status: 'degraded' as const,
    onSelectionChange: vi.fn(),
    onStatusChange: vi.fn(),
  };

  it('renders group name', () => {
    render(<GroupStatusSelector {...defaultProps} />);
    expect(screen.getByText('Backend Services')).toBeInTheDocument();
  });

  it('renders service count with correct pluralization', () => {
    render(<GroupStatusSelector {...defaultProps} serviceCount={5} />);
    expect(screen.getByText('(5 services)')).toBeInTheDocument();
  });

  it('renders singular service count', () => {
    render(<GroupStatusSelector {...defaultProps} serviceCount={1} />);
    expect(screen.getByText('(1 service)')).toBeInTheDocument();
  });

  it('renders checkbox unchecked when not selected', () => {
    render(<GroupStatusSelector {...defaultProps} selected={false} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('renders checkbox checked when selected', () => {
    render(<GroupStatusSelector {...defaultProps} selected={true} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls onSelectionChange when checkbox clicked', () => {
    const onSelectionChange = vi.fn();
    render(
      <GroupStatusSelector {...defaultProps} onSelectionChange={onSelectionChange} />
    );

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onSelectionChange).toHaveBeenCalledWith(true);
  });

  it('does not show status dropdown when not selected', () => {
    render(<GroupStatusSelector {...defaultProps} selected={false} />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('shows status dropdown when selected', () => {
    render(<GroupStatusSelector {...defaultProps} selected={true} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays current status in dropdown', () => {
    render(
      <GroupStatusSelector {...defaultProps} selected={true} status="partial_outage" />
    );
    expect(screen.getByText('Partial Outage')).toBeInTheDocument();
  });

  it('disables checkbox when disabled prop is true', () => {
    render(<GroupStatusSelector {...defaultProps} disabled={true} />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });
});
