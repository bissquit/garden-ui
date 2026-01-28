'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTemplates } from '@/hooks/use-templates';
import { EmptyState } from '@/components/features/dashboard';
import { FileText, Loader2 } from 'lucide-react';

export default function TemplatesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const { data: templates, isLoading, isError } = useTemplates();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-muted-foreground">
            Event templates for quick creation
          </p>
        </div>
        {/* Add button will be added in Phase 5 */}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-center text-destructive py-8">
          Failed to load templates.
        </div>
      ) : templates?.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No templates"
          description="No event templates have been created yet."
        />
      ) : (
        <div className="text-muted-foreground">
          {/* Templates table will be implemented in Phase 5 */}
          {templates?.length} template(s) found. Full UI coming in Phase 5.
        </div>
      )}
    </div>
  );
}
