'use client';

import { ServiceGroup } from './service-group';
import { groupServices } from '@/lib/status-utils';
import type { components } from '@/api/types.generated';

type Service = components['schemas']['Service'];
type ServiceGroupType = components['schemas']['ServiceGroup'];

interface ServiceListProps {
  services: Service[];
  groups: ServiceGroupType[];
}

export function ServiceList({ services, groups }: ServiceListProps) {
  const grouped = groupServices(services, groups);

  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No services configured yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(({ group, services: groupServices }) => (
        <ServiceGroup
          key={group?.id ?? 'ungrouped'}
          groupName={group?.name ?? null}
          services={groupServices}
        />
      ))}
    </div>
  );
}
