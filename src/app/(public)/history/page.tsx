'use client';

import { useStatusHistory } from '@/hooks/use-public-status';
import { HistoryList } from '@/components/features/status';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  const { data: events, isLoading, isError } = useStatusHistory();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to current status
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">
        Incident History
      </h1>

      {isLoading && (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="text-center text-destructive py-8">
          Failed to load history.
        </div>
      )}

      {!isLoading && !isError && <HistoryList events={events ?? []} />}
    </div>
  );
}
