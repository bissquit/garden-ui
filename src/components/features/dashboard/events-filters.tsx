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
import { X } from 'lucide-react';

export function EventsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get('type') ?? '';
  const status = searchParams.get('status') ?? '';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/events?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/dashboard/events');
  };

  const hasFilters = type || status;

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Select
        value={type || 'all'}
        onValueChange={(v) => updateFilter('type', v)}
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
        onValueChange={(v) => updateFilter('status', v)}
      >
        <SelectTrigger className="w-[180px]" data-testid="filter-status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="investigating">Investigating</SelectItem>
          <SelectItem value="identified">Identified</SelectItem>
          <SelectItem value="monitoring">Monitoring</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="scheduled">Scheduled</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
