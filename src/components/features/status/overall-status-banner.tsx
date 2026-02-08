'use client';

import { CheckCircle, AlertTriangle, XCircle, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  serviceStatusConfig,
  calculateOverallStatus,
} from '@/lib/status-utils';
import type { components } from '@/api/types.generated';

type ServiceStatus = components['schemas']['ServiceStatus'];

interface OverallStatusBannerProps {
  services: Array<{ status: ServiceStatus; effective_status?: ServiceStatus }>;
}

const icons: Record<ServiceStatus, typeof CheckCircle> = {
  operational: CheckCircle,
  degraded: AlertTriangle,
  partial_outage: AlertTriangle,
  major_outage: XCircle,
  maintenance: Wrench,
};

export function OverallStatusBanner({ services }: OverallStatusBannerProps) {
  const { status, label } = calculateOverallStatus(services);
  const config = serviceStatusConfig[status];
  const Icon = icons[status];

  return (
    <div
      className={cn(
        'rounded-lg p-6 text-center',
        config.bgLightClass,
        config.borderClass,
        'border'
      )}
    >
      <div className="flex items-center justify-center gap-3">
        <Icon className={cn('h-8 w-8', config.textClass)} />
        <h1 className={cn('text-2xl font-semibold', config.textClass)}>
          {label}
        </h1>
      </div>
      {status === 'operational' && (
        <p className="mt-2 text-sm text-muted-foreground">
          All systems are operating normally.
        </p>
      )}
    </div>
  );
}
