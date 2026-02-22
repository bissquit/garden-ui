'use client';

import { useState } from 'react';
import { DataTable } from './data-table';
import { EmptyState } from './empty-state';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ShieldCheck, MoreHorizontal, Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteChannel, useUpdateChannel, useVerifyChannel } from '@/hooks/use-channels-mutations';
import { VerifyEmailDialog } from './verify-email-dialog';
import { useToast } from '@/hooks/use-toast';
import { channelTypeShortLabel } from '@/lib/status-utils';
import { ApiError } from '@/lib/api-error';
import type { components } from '@/api/types.generated';
import type { AvailableChannelType } from '@/hooks/use-notifications-config';

type NotificationChannel = components['schemas']['NotificationChannel'];

interface ChannelsTableProps {
  channels: NotificationChannel[];
  availableChannels?: AvailableChannelType[];
}

export function ChannelsTable({
  channels,
  availableChannels = ['email', 'telegram', 'mattermost'],
}: ChannelsTableProps) {
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
        let title = 'Failed to verify channel';
        if (error instanceof ApiError) {
          if (error.isUnprocessableEntity) title = 'Channel setup incomplete';
          else if (error.isTooManyRequests) title = 'Too many attempts';
        }
        toast({
          title,
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      }
    }
  };

  const getEmptyStateDescription = () => {
    const channelNames: Record<string, string> = {
      email: 'Email',
      telegram: 'Telegram',
      mattermost: 'Mattermost',
    };
    if (availableChannels.length === 0) {
      return 'No notification channel types are currently enabled by the administrator.';
    }
    const names = availableChannels.map((ch) => channelNames[ch] ?? ch);
    if (names.length === 1) {
      const article = names[0] === 'Email' ? 'an' : 'a';
      return `Add ${article} ${names[0]} channel to receive notifications.`;
    }
    if (names.length === 2) {
      return `Add ${names[0]} or ${names[1]} channel to receive notifications.`;
    }
    return `Add ${names.slice(0, -1).join(', ')}, or ${names[names.length - 1]} channel to receive notifications.`;
  };

  const columns = [
    {
      key: 'type',
      header: 'Type',
      cell: (channel: NotificationChannel & { actions?: React.ReactNode }) => (
        <Badge variant="outline">{channelTypeShortLabel[channel.type]}</Badge>
      ),
      className: 'w-20',
    },
    {
      key: 'target',
      header: 'Channel',
      cell: (channel: NotificationChannel & { actions?: React.ReactNode }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">{channel.target}</span>
          {channel.is_default && (
            <Badge variant="outline">Default</Badge>
          )}
        </div>
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
            <Button variant="ghost" size="icon">
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
                <ShieldCheck className="mr-2 h-4 w-4" />
                Verify
              </DropdownMenuItem>
            )}
            {!channel.is_default && (
              <DropdownMenuItem
                onClick={() => setDeleteId(channel.id)}
                className="text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-10',
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
            description={getEmptyStateDescription()}
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
