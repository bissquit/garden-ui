'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useUsers } from '@/hooks/use-users';
import { useUpdateUser } from '@/hooks/use-users-mutations';
import { UsersTable } from '@/components/features/dashboard/users-table';
import { UserFormDialog } from '@/components/features/dashboard/user-form-dialog';
import { ResetPasswordDialog } from '@/components/features/dashboard/reset-password-dialog';
import { DeleteConfirmationDialog, DashboardTableSkeleton } from '@/components/features/dashboard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import type { components } from '@/api/types.generated';

type User = components['schemas']['User'];
type Role = components['schemas']['Role'];

const PAGE_SIZE = 20;

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser, hasRole } = useAuth();
  const { toast } = useToast();

  const [offset, setOffset] = useState(0);
  const [roleFilter, setRoleFilter] = useState<Role | undefined>(undefined);

  const { data, isLoading } = useUsers({
    role: roleFilter,
    limit: PAGE_SIZE,
    offset,
  });

  const updateMutation = useUpdateUser();

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | undefined>(undefined);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<User | null>(null);
  const [toggleActiveTarget, setToggleActiveTarget] = useState<User | null>(null);

  // Admin guard - redirect non-admins
  const isAdmin = hasRole('admin');
  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  const handleEdit = (user: User) => {
    setEditTarget(user);
    setEditDialogOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setResetPasswordTarget(user);
  };

  const handleToggleActive = (user: User) => {
    setToggleActiveTarget(user);
  };

  const handleConfirmToggleActive = async () => {
    if (!toggleActiveTarget) return;

    try {
      await updateMutation.mutateAsync({
        id: toggleActiveTarget.id,
        data: { is_active: !toggleActiveTarget.is_active },
      });
      toast({
        title: toggleActiveTarget.is_active
          ? 'User deactivated successfully'
          : 'User reactivated successfully',
      });
      setToggleActiveTarget(null);
    } catch (error) {
      toast({
        title: toggleActiveTarget.is_active
          ? 'Failed to deactivate user'
          : 'Failed to reactivate user',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value === 'all' ? undefined : (value as Role));
    setOffset(0);
  };

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
  };

  // Don't render anything for non-admins
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and roles</p>
        </div>
        <UserFormDialog
          trigger={
            <Button data-testid="create-user-button">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          }
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Role:</span>
          <Select
            value={roleFilter ?? 'all'}
            onValueChange={handleRoleFilterChange}
          >
            <SelectTrigger className="w-40" data-testid="role-filter-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="operator">Operator</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <DashboardTableSkeleton />
      ) : (
        <UsersTable
          users={data?.users ?? []}
          total={data?.total ?? 0}
          limit={data?.limit ?? PAGE_SIZE}
          offset={data?.offset ?? 0}
          currentUserId={currentUser?.id ?? ''}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onResetPassword={handleResetPassword}
          onToggleActive={handleToggleActive}
        />
      )}

      {/* Edit User Dialog */}
      <UserFormDialog
        user={editTarget}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditTarget(undefined);
        }}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        user={resetPasswordTarget}
        open={!!resetPasswordTarget}
        onOpenChange={(open) => !open && setResetPasswordTarget(null)}
      />

      {/* Deactivate/Reactivate Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!toggleActiveTarget}
        onOpenChange={(open) => !open && setToggleActiveTarget(null)}
        onConfirm={handleConfirmToggleActive}
        title={toggleActiveTarget?.is_active ? 'Deactivate User' : 'Reactivate User'}
        description={
          toggleActiveTarget?.is_active
            ? `Are you sure you want to deactivate "${toggleActiveTarget?.email}"? They will no longer be able to log in.`
            : `Are you sure you want to reactivate "${toggleActiveTarget?.email}"? They will be able to log in again.`
        }
        isLoading={updateMutation.isPending}
        confirmText={toggleActiveTarget?.is_active ? 'Deactivate' : 'Reactivate'}
      />
    </div>
  );
}
