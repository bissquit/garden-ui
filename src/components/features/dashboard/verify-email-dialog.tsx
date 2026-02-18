'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import { useVerifyChannel, useResendVerificationCode } from '@/hooks/use-channels-mutations';
import { useToast } from '@/hooks/use-toast';

interface VerifyEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
  email: string;
}

const RESEND_COOLDOWN = 60;

export function VerifyEmailDialog({
  open,
  onOpenChange,
  channelId,
  email,
}: VerifyEmailDialogProps) {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const verifyMutation = useVerifyChannel();
  const resendMutation = useResendVerificationCode();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (open) {
      setCode('');
    }
  }, [open]);

  const handleVerify = async () => {
    if (code.length !== 6) return;

    try {
      await verifyMutation.mutateAsync({ id: channelId, code });
      toast({ title: 'Email verified successfully' });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Verification failed',
        description: error instanceof Error ? error.message : 'Invalid code',
        variant: 'destructive',
      });
    }
  };

  const handleResend = async () => {
    try {
      await resendMutation.mutateAsync(channelId);
      toast({ title: 'Verification code sent' });
      setCooldown(RESEND_COOLDOWN);
    } catch (error) {
      toast({
        title: 'Failed to resend code',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive',
      });
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  const isVerifying = verifyMutation.isPending;
  const isResending = resendMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Verify Email
          </DialogTitle>
          <DialogDescription>
            We sent a 6-digit code to <strong>{email}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Verification Code</label>
            <Input
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
            >
              {isResending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </Button>

            <Button
              onClick={handleVerify}
              disabled={code.length !== 6 || isVerifying}
            >
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
