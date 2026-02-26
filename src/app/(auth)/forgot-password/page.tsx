'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useNotificationsConfig } from '@/hooks/use-notifications-config';
import { ForgotPasswordForm } from '@/components/features/auth/forgot-password-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, InfoIcon, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { data: config, isLoading } = useNotificationsConfig();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isEmailAvailable = config?.available_channels.includes('email') ?? false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : successMessage ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          ) : !isEmailAvailable ? (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Email is not configured. Please contact your administrator to reset your password.
              </AlertDescription>
            </Alert>
          ) : (
            <ForgotPasswordForm onSuccess={setSuccessMessage} />
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm text-primary hover:underline">
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
