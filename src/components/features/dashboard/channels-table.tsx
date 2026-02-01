'use client';

import { useState } from 'react';
import { DataTable } from './data-table';
import { EmptyState } from './empty-state';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Mail, MoreHorizontal, CheckCircle, XCircle, Shield } from 'lucide-react';
import { useDeleteChannel, useUpdateChannel, useVerifyChannel } from '@/hooks/use-channels-mutations';
import { useToast } from '@/hooks/use-toast';
import type { components } from '@/api/types.generated';

type NotificationChannel = components['schemas']['NotificationChannel'];

interface ChannelsTableProps {
  channels: NotificationChannel[];
}

export function ChannelsTable({ channels }: ChannelsTableProps) {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteMutation = useDeleteChannel();
  const updateMutation = useUpdateChannel();
  const verifyMutation = useVerifyChannel();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast({ title: 'Channel deleted successfully' });
      setDeleteId(null);
    } catch (error) {
      toast({
        title: 'Failed to delete channel',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleToggleEnabled = async (channel: NotificationChannel) => {
    try {
      await updateMutation.mutateAsync({
        id: channel.id,
        data: { is_enabled: !channel.is_enabled },
      });
      toast({
        title: channel.is_enabled ? 'Channel disabled' : 'Channel enabled',
      });
    } catch (error) {
      toast({
        title: 'Failed to update channel',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleVerify = async (channel: NotificationChannel) => {
    try {
      await verifyMutation.mutateAsync(channel.id);
      toast({ title: 'Verification initiated' });
    } catch (error) {
      toast({
        title: 'Failed to verify channel',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const columns = [
    {
      key: 'type',
      header: 'Type',
      cell: (channel: NotificationChannel & { actions?: React.ReactNode }) => (
        <div className="flex items-center gap-2">
          {channel.type === 'email' ? (
            <Mail className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Bell className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="capitalize">{channel.type}</span>
        </div>
      ),
    },
    {
      key: 'target',
      header: 'Target',
      cell: (channel: NotificationChannel & { actions?: React.ReactNode }) => (
        <span className="font-mono text-sm">{channel.target}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (channel: NotificationChannel & { actions?: React.ReactNode }) => (
        <Badge variant={channel.is_enabled ? 'default' : 'secondary'}>
          {channel.is_enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      ),
    },
    {
      key: 'verified',
      header: 'Verified',
      cell: (channel: NotificationChannel & { actions?: React.ReactNode }) => (
        <div className="flex items-center gap-1">
          {channel.is_verified ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">Verified</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-600">Unverified</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (channel: NotificationChannel & { actions?: React.ReactNode }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleToggleEnabled(channel)}
              disabled={updateMutation.isPending}
            >
              {channel.is_enabled ? 'Disable' : 'Enable'}
            </DropdownMenuItem>
            {!channel.is_verified && (
              <DropdownMenuItem
                onClick={() => handleVerify(channel)}
                disabled={verifyMutation.isPending}
              >
                <Shield className="mr-2 h-4 w-4" />
                Verify
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => setDeleteId(channel.id)}
              className="text-destructive focus:text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-16',
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={channels}
        emptyState={
          <EmptyState
            icon={Bell}
            title="No notification channels"
            description="Add an email or Telegram channel to receive notifications."
          />
        }
      />

      <DeleteConfirmationDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Channel"
        description="Are you sure you want to delete this notification channel? You will no longer receive notifications through this channel."
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
