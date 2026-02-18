'use client';

import { useState } from 'react';
import { DataTable } from './data-table';
import { EmptyState } from './empty-state';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, Hash, CheckCircle, XCircle, Power, ShieldCheck, Trash2, Bell } from 'lucide-react';
import { useDeleteChannel, useUpdateChannel, useVerifyChannel } from '@/hooks/use-channels-mutations';
import { VerifyEmailDialog } from './verify-email-dialog';
import { useToast } from '@/hooks/use-toast';
import type { components } from '@/api/types.generated';

type NotificationChannel = components['schemas']['NotificationChannel'];

interface ChannelsTableProps {
  channels: NotificationChannel[];
}

export function ChannelsTable({ channels }: ChannelsTableProps) {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [verifyEmailChannel, setVerifyEmailChannel] = useState<NotificationChannel | null>(null);

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
    if (channel.type === 'email') {
      setVerifyEmailChannel(channel);
    } else {
      try {
        await verifyMutation.mutateAsync({ id: channel.id });
        toast({ title: 'Verification message sent' });
      } catch (error) {
        toast({
          title: 'Failed to verify channel',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      }
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
          ) : channel.type === 'telegram' ? (
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Hash className="h-4 w-4 text-muted-foreground" />
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
        <div className="flex items-center justify-end gap-1">
          {!channel.is_verified && (
            <Button
              variant="ghost"
              size="icon"
              title="Verify channel"
              onClick={(e) => {
                e.stopPropagation();
                handleVerify(channel);
              }}
              disabled={verifyMutation.isPending}
            >
              <ShieldCheck className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            title={channel.is_enabled ? 'Disable channel' : 'Enable channel'}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleEnabled(channel);
            }}
            disabled={updateMutation.isPending}
          >
            <Power className={`h-4 w-4 ${channel.is_enabled ? 'text-green-500' : 'text-amber-500'}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete channel"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(channel.id);
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
      className: 'w-28',
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
            description="Add an email, Telegram, or Mattermost channel to receive notifications."
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

      {verifyEmailChannel && (
        <VerifyEmailDialog
          open={verifyEmailChannel !== null}
          onOpenChange={(open) => !open && setVerifyEmailChannel(null)}
          channelId={verifyEmailChannel.id}
          email={verifyEmailChannel.target}
        />
      )}
    </>
  );
}
