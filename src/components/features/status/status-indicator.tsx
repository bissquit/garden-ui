'use client';

import { cn } from '@/lib/utils';
import { serviceStatusConfig } from '@/lib/status-utils';
import type { components } from '@/api/types.generated';

type ServiceStatus = components['schemas']['ServiceStatus'];

interface StatusIndicatorProps {
  status: ServiceStatus;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export function StatusIndicator({
  status,
  size = 'md',
  pulse = false,
}: StatusIndicatorProps) {
  const config = serviceStatusConfig[status];

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <span className="relative flex" data-testid="status-indicator">
      {pulse && status !== 'operational' && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
            config.bgClass
          )}
        />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full',
          sizeClasses[size],
          config.bgClass
        )}
      />
    </span>
  );
}
