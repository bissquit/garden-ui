'use client';

import { useAuth } from '@/hooks/use-auth';
import { useServices, useGroups } from '@/hooks/use-public-status';
import { ServicesTable } from '@/components/features/dashboard';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ServicesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const { data: services, isLoading: servicesLoading } = useServices();
  const { data: groups, isLoading: groupsLoading } = useGroups();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

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

  const isLoading = servicesLoading || groupsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground">Manage your services</p>
        </div>
        {/* Add button will be added in Phase 5 */}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ServicesTable services={services ?? []} groups={groups ?? []} />
      )}
    </div>
  );
}
