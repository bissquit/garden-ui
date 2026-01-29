'use client';

import { useState, useMemo } from 'react';
import { useServices, useGroups } from '@/hooks/use-public-status';
import { useDeleteGroup } from '@/hooks/use-groups-mutations';
import {
  GroupsTable,
  GroupFormDialog,
  DeleteConfirmationDialog,
} from '@/components/features/dashboard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Pencil } from 'lucide-react';
import type { components } from '@/api/types.generated';

type ServiceGroup = components['schemas']['ServiceGroup'];

export default function GroupsPage() {
  const { data: services } = useServices();
  const { data: groups, isLoading } = useGroups();
  const deleteMutation = useDeleteGroup();
  const { toast } = useToast();

  const [deleteTarget, setDeleteTarget] = useState<ServiceGroup | null>(null);

  const serviceCount = useMemo(() => {
    const map = new Map<string, number>();
    services?.forEach((service) => {
      if (service.group_id) {
        map.set(service.group_id, (map.get(service.group_id) ?? 0) + 1);
      }
    });
    return map;
  }, [services]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.slug);
      toast({ title: 'Group deleted successfully' });
      setDeleteTarget(null);
    } catch (error) {
      toast({
        title: 'Failed to delete group',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // Add action column to groups
  const groupsWithActions = groups?.map((group) => ({
    ...group,
    actions: (
      <div className="flex items-center gap-2">
        <GroupFormDialog
          group={group}
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
            setDeleteTarget(group);
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
          <h1 className="text-2xl font-bold">Groups</h1>
          <p className="text-muted-foreground">Organize services into groups</p>
        </div>
        <GroupFormDialog />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <GroupsTable groups={groupsWithActions ?? []} serviceCount={serviceCount} />
      )}

      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Group"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? Services in this group will become ungrouped.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
