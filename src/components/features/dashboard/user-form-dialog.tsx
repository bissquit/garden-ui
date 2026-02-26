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
import { UserForm } from './user-form';
import { useCreateUser, useUpdateUser } from '@/hooks/use-users-mutations';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil } from 'lucide-react';
import type { components } from '@/api/types.generated';
import type { CreateUserInput, UpdateUserInput } from '@/lib/validations/user';

type User = components['schemas']['User'];

interface UserFormDialogProps {
  user?: User;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UserFormDialog({ user, trigger, open: controlledOpen, onOpenChange }: UserFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { toast } = useToast();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (val: boolean) => onOpenChange?.(val)
    : setInternalOpen;

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const isEditing = !!user;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (data: CreateUserInput | UpdateUserInput) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: user.id,
          data: data as UpdateUserInput,
        });
      } else {
        const createData = data as CreateUserInput;
        await createMutation.mutateAsync({
          email: createData.email,
          password: createData.password,
          first_name: createData.first_name || undefined,
          last_name: createData.last_name || undefined,
          role: createData.role,
        });
      }

      toast({
        title: isEditing ? 'User updated successfully' : 'User created successfully',
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: isEditing ? 'Failed to update user' : 'Failed to create user',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const dialogContent = (
    <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? 'Edit User' : 'Create User'}
        </DialogTitle>
      </DialogHeader>
      <UserForm
        key={user?.id ?? 'new'}
        user={user}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </DialogContent>
  );

  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    );
  }

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
                Add User
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
