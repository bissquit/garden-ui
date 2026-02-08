'use client';

import { cn } from '@/lib/utils';
import { StatusIndicator } from './status-indicator';
import { serviceStatusConfig } from '@/lib/status-utils';
import type { components } from '@/api/types.generated';

type Service = components['schemas']['Service'];

interface ServiceItemProps {
  service: Service;
}

export function ServiceItem({ service }: ServiceItemProps) {
  // Use effective_status (includes active events) with fallback to status
  const displayStatus = service.effective_status ?? service.status;
  const config = serviceStatusConfig[displayStatus];

  return (
    <div
      className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 rounded-md transition-colors"
      data-testid="service-item"
    >
      <div className="flex items-center gap-3">
        <span className="font-medium text-foreground">{service.name}</span>
        {service.description && (
          <span className="text-sm text-muted-foreground hidden sm:inline">
            — {service.description}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('text-sm font-medium', config.textClass)}>
          {config.label}
        </span>
        <StatusIndicator
          status={displayStatus}
          pulse={displayStatus !== 'operational'}
        />
      </div>
    </div>
  );
}
