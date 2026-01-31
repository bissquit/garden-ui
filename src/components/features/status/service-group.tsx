'use client';

import { ServiceItem } from './service-item';
import type { components } from '@/api/types.generated';

type Service = components['schemas']['Service'];

interface ServiceGroupProps {
  groupName: string | null;
  services: Service[];
}

export function ServiceGroup({ groupName, services }: ServiceGroupProps) {
  // Sort by order
  const sorted = [...services].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-1" data-testid="service-group">
      {groupName && (
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2">
          {groupName}
        </h3>
      )}
      <div className="bg-card rounded-lg border border-border divide-y divide-border">
        {sorted.map((service) => (
          <ServiceItem key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
}
