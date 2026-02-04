'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useServices, useGroups } from '@/hooks/use-public-status';
import { useDeleteService, useRestoreService } from '@/hooks/use-services-mutations';
import {
  ServicesTable,
  ServiceFormDialog,
  DeleteConfirmationDialog,
} from '@/components/features/dashboard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Archive, Pencil, RotateCcw, Plus } from 'lucide-react';
import type { components } from '@/api/types.generated';

type Service = components['schemas']['Service'];

export default function ServicesPage() {
  const { hasMinRole } = useAuth();
  const canEdit = hasMinRole('operator');

  const [showArchived, setShowArchived] = useState(false);
  const { data: services, isLoading: servicesLoading } = useServices({ includeArchived: showArchived });
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const deleteMutation = useDeleteService();
  const restoreMutation = useRestoreService();
  const { toast } = useToast();

  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const isLoading = servicesLoading || groupsLoading;

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.slug);
      toast({ title: 'Service archived successfully' });
      setDeleteTarget(null);
    } catch (error) {
      toast({
        title: 'Failed to archive service',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleRestore = async (service: Service) => {
    try {
      await restoreMutation.mutateAsync(service.slug);
      toast({ title: 'Service restored successfully' });
    } catch (error) {
      toast({
        title: 'Failed to restore service',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // Add action column to services
  const servicesWithActions = services?.map((service) => ({
    ...service,
    actions: canEdit ? (
      service.archived_at ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleRestore(service);
          }}
          disabled={restoreMutation.isPending}
          data-testid="restore-button"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Restore
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <ServiceFormDialog
            service={service}
            trigger={
              <Button variant="ghost" size="icon" data-testid="edit-button">
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
            data-testid="delete-button"
          >
            <Archive className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      )
    ) : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground">Manage your services</p>
        </div>
        {canEdit && (
          <ServiceFormDialog trigger={
            <Button data-testid="create-service-button">
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          } />
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="show-archived"
          checked={showArchived}
          onCheckedChange={setShowArchived}
          data-testid="show-archived-toggle"
        />
        <Label htmlFor="show-archived">Show archived</Label>
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
        title="Archive Service"
        description={`Are you sure you want to archive "${deleteTarget?.name}"? You can restore it later.`}
        isLoading={deleteMutation.isPending}
        confirmText="Archive"
      />
    </div>
  );
}
