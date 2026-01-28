'use client';

import { useStatusPageData } from '@/hooks/use-public-status';
import {
  OverallStatusBanner,
  ServiceList,
  ActiveIncidents,
  ScheduledMaintenance,
} from '@/components/features/status';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StatusPage() {
  const { services, groups, events, isLoading, isError, refetch } =
    useStatusPageData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">Failed to load status data.</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Overall Status Banner */}
      <OverallStatusBanner services={services ?? []} />

      {/* Active Incidents */}
      <ActiveIncidents events={events ?? []} />

      {/* Scheduled Maintenance */}
      <ScheduledMaintenance events={events ?? []} />

      {/* Services List */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Services</h2>
        <ServiceList services={services ?? []} groups={groups ?? []} />
      </section>

      {/* Footer with last updated timestamp */}
      <footer className="text-center text-sm text-muted-foreground pt-4 border-t">
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          className="mt-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </footer>
    </div>
  );
}
