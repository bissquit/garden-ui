'use client';

import { DataTable } from './data-table';
import { EmptyState } from './empty-state';
import { FolderTree } from 'lucide-react';
import { formatEventDate } from '@/lib/status-utils';
import type { components } from '@/api/types.generated';

type ServiceGroup = components['schemas']['ServiceGroup'];

interface GroupsTableProps {
  groups: ServiceGroup[];
  serviceCount: Map<string, number>;
}

export function GroupsTable({ groups, serviceCount }: GroupsTableProps) {
  const columns = [
    {
      key: 'name',
      header: 'Name',
      cell: (group: ServiceGroup) => (
        <div>
          <div className="font-medium">{group.name}</div>
          <div className="text-sm text-muted-foreground">{group.slug}</div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      cell: (group: ServiceGroup) => (
        <span className="text-muted-foreground">
          {group.description || '—'}
        </span>
      ),
      className: 'hidden md:table-cell',
    },
    {
      key: 'services',
      header: 'Services',
      cell: (group: ServiceGroup) => (
        <span>{serviceCount.get(group.id) ?? 0}</span>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      cell: (group: ServiceGroup) => (
        <span className="text-muted-foreground">{group.order}</span>
      ),
    },
    {
      key: 'updated',
      header: 'Last Updated',
      cell: (group: ServiceGroup) => (
        <span className="text-muted-foreground text-sm">
          {formatEventDate(group.updated_at)}
        </span>
      ),
      className: 'hidden lg:table-cell',
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={groups}
      emptyState={
        <EmptyState
          icon={FolderTree}
          title="No groups"
          description="No service groups have been created yet."
        />
      }
    />
  );
}
