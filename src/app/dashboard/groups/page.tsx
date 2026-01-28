'use client';

import { useAuth } from '@/hooks/use-auth';
import { useServices, useGroups } from '@/hooks/use-public-status';
import { GroupsTable } from '@/components/features/dashboard';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

export default function GroupsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const { data: services } = useServices();
  const { data: groups, isLoading } = useGroups();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Count services in each group
  const serviceCount = useMemo(() => {
    const map = new Map<string, number>();
    services?.forEach((service) => {
      if (service.group_id) {
        map.set(service.group_id, (map.get(service.group_id) ?? 0) + 1);
      }
    });
    return map;
  }, [services]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Groups</h1>
          <p className="text-muted-foreground">Organize services into groups</p>
        </div>
        {/* Add button will be added in Phase 5 */}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <GroupsTable groups={groups ?? []} serviceCount={serviceCount} />
      )}
    </div>
  );
}
