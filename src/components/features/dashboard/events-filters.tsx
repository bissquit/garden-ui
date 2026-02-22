'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { eventStatusConfig } from '@/lib/status-utils';
import { incidentStatuses, maintenanceStatuses } from '@/lib/validations/event';

const resolvedStatuses = ['resolved', 'completed'];

function getAvailableStatuses(type: string, active: boolean): string[] {
  let statuses: string[];

  if (type === 'incident') {
    statuses = [...incidentStatuses];
  } else if (type === 'maintenance') {
    statuses = [...maintenanceStatuses];
  } else {
    statuses = [...incidentStatuses, ...maintenanceStatuses];
  }

  if (active) {
    statuses = statuses.filter((s) => !resolvedStatuses.includes(s));
  }

  return statuses;
}

export function EventsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get('type') ?? '';
  const status = searchParams.get('status') ?? '';
  const active = searchParams.get('active') === 'true';

  const availableStatuses = getAvailableStatuses(type, active);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.push(`/dashboard/events?${params.toString()}`);
  };

  const handleTypeChange = (value: string) => {
    const newType = value === 'all' ? '' : value;
    const newAvailable = getAvailableStatuses(newType, active);
    const updates: Record<string, string | null> = { type: newType || null };

    // Clear status if it's not valid for the new type
    if (status && !newAvailable.includes(status)) {
      updates.status = null;
    }

    updateParams(updates);
  };

  const handleStatusChange = (value: string) => {
    updateParams({ status: value === 'all' ? null : value });
  };

  const handleActiveChange = (checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    const updates: Record<string, string | null> = {
      active: isChecked ? 'true' : null,
    };

    // Clear status if it becomes invalid when active filter is toggled on
    if (isChecked && status && resolvedStatuses.includes(status)) {
      updates.status = null;
    }

    updateParams(updates);
  };

  const clearFilters = () => {
    router.push('/dashboard/events');
  };

  const activeFilterCount =
    (type ? 1 : 0) + (status ? 1 : 0) + (active ? 1 : 0);
  const hasFilters = activeFilterCount > 0;

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Select
        value={type || 'all'}
        onValueChange={handleTypeChange}
      >
        <SelectTrigger className="w-[150px]" data-testid="filter-type">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="incident">Incident</SelectItem>
          <SelectItem value="maintenance">Maintenance</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={status || 'all'}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[180px]" data-testid="filter-status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {availableStatuses.map((s) => (
            <SelectItem key={s} value={s}>
              {eventStatusConfig[s as keyof typeof eventStatusConfig].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="flex items-center gap-2 text-sm cursor-pointer" data-testid="filter-active">
        <Checkbox checked={active} onCheckedChange={handleActiveChange} />
        Active only
      </label>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="clear-filters">
          <X className="h-4 w-4 mr-1" />
          Clear{activeFilterCount > 1 ? ` (${activeFilterCount})` : ''}
        </Button>
      )}
    </div>
  );
}
