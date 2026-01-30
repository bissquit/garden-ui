'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GroupForm } from './group-form';
import { useCreateGroup, useUpdateGroup } from '@/hooks/use-groups-mutations';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil } from 'lucide-react';
import type { components } from '@/api/types.generated';
import type { CreateGroupFormData } from '@/lib/validations/group';

type ServiceGroup = components['schemas']['ServiceGroup'];

interface GroupFormDialogProps {
  group?: ServiceGroup;
  trigger?: React.ReactNode;
}

export function GroupFormDialog({ group, trigger }: GroupFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const createMutation = useCreateGroup();
  const updateMutation = useUpdateGroup();

  const isEditing = !!group;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (data: CreateGroupFormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ slug: group.slug, data });
        toast({ title: 'Group updated successfully' });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: 'Group created successfully' });
      }
      setOpen(false);
    } catch (error) {
      toast({
        title: isEditing ? 'Failed to update group' : 'Failed to create group',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            {isEditing ? (
              <>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Group
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Group' : 'Create Group'}
          </DialogTitle>
        </DialogHeader>
        <GroupForm
          group={group}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
