'use client';

import { useAuth } from '@/hooks/use-auth';
import { useServices, useGroups } from '@/hooks/use-public-status';
import { useEvents } from '@/hooks/use-events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, FolderTree, AlertCircle, Wrench, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  const { data: services, isLoading: servicesLoading } = useServices();
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const { data: events, isLoading: eventsLoading } = useEvents();

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

  const isLoading = servicesLoading || groupsLoading || eventsLoading;

  const activeIncidents =
    events?.filter((e) => e.type === 'incident' && e.status !== 'resolved')
      .length ?? 0;

  const activeMaintenance =
    events?.filter((e) => e.type === 'maintenance' && e.status !== 'completed')
      .length ?? 0;

  const stats = [
    {
      name: 'Total Services',
      value: services?.length ?? 0,
      icon: Server,
      href: '/dashboard/services',
      highlight: false,
    },
    {
      name: 'Service Groups',
      value: groups?.length ?? 0,
      icon: FolderTree,
      href: '/dashboard/groups',
      highlight: false,
    },
    {
      name: 'Active Incidents',
      value: activeIncidents,
      icon: AlertCircle,
      href: '/dashboard/events?type=incident',
      highlight: activeIncidents > 0,
    },
    {
      name: 'Active Maintenance',
      value: activeMaintenance,
      icon: Wrench,
      href: '/dashboard/events?type=maintenance',
      highlight: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.first_name || user?.email}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.name} href={stat.href}>
              <Card
                className={
                  stat.highlight
                    ? 'border-red-500 hover:bg-muted/50 transition-colors'
                    : 'hover:bg-muted/50 transition-colors'
                }
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </CardTitle>
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
