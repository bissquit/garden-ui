'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useServices, useGroups } from '@/hooks/use-public-status';
import { useDeleteGroup, useRestoreGroup } from '@/hooks/use-groups-mutations';
import {
  GroupsTable,
  GroupFormDialog,
  DeleteConfirmationDialog,
} from '@/components/features/dashboard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Archive, Pencil, RotateCcw, Plus } from 'lucide-react';
import type { components } from '@/api/types.generated';

type ServiceGroup = components['schemas']['ServiceGroup'];

export default function GroupsPage() {
  const { hasMinRole } = useAuth();
  const canEdit = hasMinRole('operator');

  const [showArchived, setShowArchived] = useState(false);
  const { data: services } = useServices();
  const { data: groups, isLoading } = useGroups({ includeArchived: showArchived });
  const deleteMutation = useDeleteGroup();
  const restoreMutation = useRestoreGroup();
  const { toast } = useToast();

  const [deleteTarget, setDeleteTarget] = useState<ServiceGroup | null>(null);

  const serviceCount = useMemo(() => {
    const map = new Map<string, number>();
    services?.forEach((service) => {
      for (const groupId of service.group_ids ?? []) {
        map.set(groupId, (map.get(groupId) ?? 0) + 1);
      }
    });
    return map;
  }, [services]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.slug);
      toast({ title: 'Group archived successfully' });
      setDeleteTarget(null);
    } catch (error) {
      toast({
        title: 'Failed to archive group',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleRestore = async (group: ServiceGroup) => {
    try {
      await restoreMutation.mutateAsync(group.slug);
      toast({ title: 'Group restored successfully' });
    } catch (error) {
      toast({
        title: 'Failed to restore group',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // Add action column to groups
  const groupsWithActions = groups?.map((group) => ({
    ...group,
    actions: canEdit ? (
      group.archived_at ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleRestore(group);
          }}
          disabled={restoreMutation.isPending}
          data-testid="restore-button"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Restore
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <GroupFormDialog
            group={group}
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
              setDeleteTarget(group);
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
          <h1 className="text-2xl font-bold">Groups</h1>
          <p className="text-muted-foreground">Organize services into groups</p>
        </div>
        {canEdit && (
          <GroupFormDialog trigger={
            <Button data-testid="create-group-button">
              <Plus className="mr-2 h-4 w-4" />
              Add Group
            </Button>
          } />
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="show-archived-groups"
          checked={showArchived}
          onCheckedChange={setShowArchived}
          data-testid="show-archived-toggle"
        />
        <Label htmlFor="show-archived-groups">Show archived</Label>
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
        title="Archive Group"
        description={`Are you sure you want to archive "${deleteTarget?.name}"? Services in this group will become ungrouped. You can restore it later.`}
        isLoading={deleteMutation.isPending}
        confirmText="Archive"
      />
    </div>
  );
}
