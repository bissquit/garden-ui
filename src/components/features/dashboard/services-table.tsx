'use client';

import { DataTable } from './data-table';
import { EmptyState } from './empty-state';
import { StatusIndicator } from '@/components/features/status';
import { serviceStatusConfig, formatEventDate } from '@/lib/status-utils';
import { Server } from 'lucide-react';
import type { components } from '@/api/types.generated';

type Service = components['schemas']['Service'];

interface ServicesTableProps {
  services: Service[];
  groups: Array<{ id: string; name: string }>;
}

export function ServicesTable({ services, groups }: ServicesTableProps) {
  const groupMap = new Map(groups.map((g) => [g.id, g.name]));

  const columns = [
    {
      key: 'name',
      header: 'Name',
      cell: (service: Service) => (
        <div>
          <div className="font-medium">{service.name}</div>
          <div className="text-sm text-muted-foreground">{service.slug}</div>
        </div>
      ),
    },
    {
      key: 'group',
      header: 'Group',
      cell: (service: Service) => (
        <span className="text-muted-foreground">
          {service.group_id ? groupMap.get(service.group_id) ?? '—' : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (service: Service) => {
        const config = serviceStatusConfig[service.status];
        return (
          <div className="flex items-center gap-2">
            <StatusIndicator status={service.status} />
            <span className={config.textClass}>{config.label}</span>
          </div>
        );
      },
    },
    {
      key: 'updated',
      header: 'Last Updated',
      cell: (service: Service) => (
        <span className="text-muted-foreground text-sm">
          {formatEventDate(service.updated_at)}
        </span>
      ),
      className: 'hidden md:table-cell',
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={services}
      emptyState={
        <EmptyState
          icon={Server}
          title="No services"
          description="No services have been created yet."
        />
      }
    />
  );
}
