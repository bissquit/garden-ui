'use client';

import { DataTable } from './data-table';
import { EmptyState } from './empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatEventDate } from '@/lib/status-utils';
import { Users, Pencil, KeyRound, Ban, RotateCcw } from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { components } from '@/api/types.generated';

type User = components['schemas']['User'];

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  operator: 'secondary',
  user: 'outline',
};

interface UsersTableProps {
  users: User[];
  total: number;
  limit: number;
  offset: number;
  currentUserId: string;
  onPageChange: (offset: number) => void;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
  onToggleActive: (user: User) => void;
}

export function UsersTable({
  users,
  total,
  limit,
  offset,
  currentUserId,
  onPageChange,
  onEdit,
  onResetPassword,
  onToggleActive,
}: UsersTableProps) {
  const columns = [
    {
      key: 'email',
      header: 'User',
      cell: (user: User) => (
        <div>
          <div className="font-medium">{user.email}</div>
          {(user.first_name || user.last_name) && (
            <div className="text-sm text-muted-foreground">
              {[user.first_name, user.last_name].filter(Boolean).join(' ')}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (user: User) => (
        <Badge variant={roleBadgeVariant[user.role] ?? 'outline'}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (user: User) => (
        <Badge variant={user.is_active ? 'secondary' : 'destructive'}>
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      cell: (user: User) => (
        <span className="text-muted-foreground text-sm">
          {formatEventDate(user.created_at)}
        </span>
      ),
      className: 'hidden md:table-cell',
    },
    {
      key: 'actions',
      header: '',
      cell: (user: User) => {
        if (user.id === currentUserId) {
          return (
            <span className="text-sm text-muted-foreground italic">You</span>
          );
        }

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(user);
              }}
              title="Edit user"
              data-testid="edit-user-button"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onResetPassword(user);
              }}
              title="Reset password"
              data-testid="reset-password-button"
            >
              <KeyRound className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onToggleActive(user);
              }}
              title={user.is_active ? 'Deactivate user' : 'Reactivate user'}
              data-testid="toggle-active-button"
            >
              {user.is_active ? (
                <Ban className="h-4 w-4 text-muted-foreground" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
      },
      className: 'w-32',
    },
  ];

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const showingFrom = total === 0 ? 0 : offset + 1;
  const showingTo = Math.min(offset + limit, total);

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={users}
        emptyState={
          <EmptyState
            icon={Users}
            title="No users"
            description="No users found matching the current filter."
          />
        }
        rowClassName={(user) => (!user.is_active ? 'opacity-60' : '')}
      />

      {total > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {showingFrom}-{showingTo} of {total}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(0, offset - limit))}
              disabled={offset === 0}
              data-testid="prev-page-button"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(offset + limit)}
              disabled={offset + limit >= total}
              data-testid="next-page-button"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
