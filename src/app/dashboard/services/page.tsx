'use client';

import { useState } from 'react';
import { useServices, useGroups } from '@/hooks/use-public-status';
import { useDeleteService } from '@/hooks/use-services-mutations';
import {
  ServicesTable,
  ServiceFormDialog,
  DeleteConfirmationDialog,
} from '@/components/features/dashboard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Pencil } from 'lucide-react';
import type { components } from '@/api/types.generated';

type Service = components['schemas']['Service'];

export default function ServicesPage() {
  const { data: services, isLoading: servicesLoading } = useServices();
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const deleteMutation = useDeleteService();
  const { toast } = useToast();

  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const isLoading = servicesLoading || groupsLoading;

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.slug);
      toast({ title: 'Service deleted successfully' });
      setDeleteTarget(null);
    } catch (error) {
      toast({
        title: 'Failed to delete service',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // Add action column to services
  const servicesWithActions = services?.map((service) => ({
    ...service,
    actions: (
      <div className="flex items-center gap-2">
        <ServiceFormDialog
          service={service}
          trigger={
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          }
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(service);
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    ),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground">Manage your services</p>
        </div>
        <ServiceFormDialog />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ServicesTable
          services={servicesWithActions ?? []}
          groups={groups ?? []}
        />
      )}

      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Service"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
