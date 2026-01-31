'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useServices } from '@/hooks/use-public-status';
import { ServiceTagsEditor } from '@/components/features/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusIndicator } from '@/components/features/status';
import { serviceStatusConfig, formatEventDate } from '@/lib/status-utils';
import { Loader2, ArrowLeft, Server } from 'lucide-react';

interface ServiceDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export default function ServiceDetailsPage({ params }: ServiceDetailsPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: services, isLoading, isError } = useServices({ includeArchived: true });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="text-center text-destructive py-8">
          Failed to load service details.
        </div>
      </div>
    );
  }

  const service = services?.find((s) => s.slug === slug);

  if (!service) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="text-center text-muted-foreground py-8">
          Service not found.
        </div>
      </div>
    );
  }

  const statusConfig = serviceStatusConfig[service.status];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server className="h-6 w-6" />
            {service.name}
            {service.archived_at && (
              <Badge variant="outline" className="text-muted-foreground">
                Archived
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">{service.slug}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusIndicator status={service.status} />
                <span className={statusConfig.textClass}>{statusConfig.label}</span>
              </div>
            </div>

            {service.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="mt-1">{service.description}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Display Order</p>
              <p className="mt-1">{service.order ?? 0}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="mt-1">{formatEventDate(service.created_at)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="mt-1">{formatEventDate(service.updated_at)}</p>
            </div>
          </CardContent>
        </Card>

        <ServiceTagsEditor slug={slug} />
      </div>
    </div>
  );
}
