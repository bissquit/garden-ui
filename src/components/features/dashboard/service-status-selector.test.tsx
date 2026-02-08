import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceStatusSelector } from './service-status-selector';

describe('ServiceStatusSelector', () => {
  const defaultProps = {
    serviceId: 'svc-1',
    serviceName: 'API Gateway',
    selected: false,
    status: 'degraded' as const,
    onSelectionChange: vi.fn(),
    onStatusChange: vi.fn(),
  };

  it('renders service name', () => {
    render(<ServiceStatusSelector {...defaultProps} />);
    expect(screen.getByText('API Gateway')).toBeInTheDocument();
  });

  it('renders checkbox unchecked when not selected', () => {
    render(<ServiceStatusSelector {...defaultProps} selected={false} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('renders checkbox checked when selected', () => {
    render(<ServiceStatusSelector {...defaultProps} selected={true} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls onSelectionChange when checkbox clicked', () => {
    const onSelectionChange = vi.fn();
    render(
      <ServiceStatusSelector {...defaultProps} onSelectionChange={onSelectionChange} />
    );

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onSelectionChange).toHaveBeenCalledWith(true);
  });

  it('does not show status dropdown when not selected', () => {
    render(<ServiceStatusSelector {...defaultProps} selected={false} />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('shows status dropdown when selected', () => {
    render(<ServiceStatusSelector {...defaultProps} selected={true} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays current status in dropdown', () => {
    render(
      <ServiceStatusSelector {...defaultProps} selected={true} status="major_outage" />
    );
    expect(screen.getByText('Major Outage')).toBeInTheDocument();
  });

  it('disables checkbox when disabled prop is true', () => {
    render(<ServiceStatusSelector {...defaultProps} disabled={true} />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });
});
