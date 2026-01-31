'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTemplates } from '@/hooks/use-templates';
import { useDeleteTemplate } from '@/hooks/use-templates-mutations';
import {
  TemplatesTable,
  TemplateFormDialog,
  DeleteConfirmationDialog,
} from '@/components/features/dashboard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Plus } from 'lucide-react';
import type { components } from '@/api/types.generated';

type EventTemplate = components['schemas']['EventTemplate'];

export default function TemplatesPage() {
  const { isAuthenticated, isLoading: authLoading, hasRole } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const { data: templates, isLoading, isError } = useTemplates();
  const deleteMutation = useDeleteTemplate();

  const [deleteTarget, setDeleteTarget] = useState<EventTemplate | null>(null);

  const isAdmin = hasRole('admin');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({ title: 'Template deleted successfully' });
      setDeleteTarget(null);
    } catch (error) {
      toast({
        title: 'Failed to delete template',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

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

  // Add action column to templates
  const templatesWithActions = templates?.map((template) => ({
    ...template,
    actions: isAdmin ? (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(template);
          }}
          data-testid="delete-button"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    ) : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-muted-foreground">
            Event templates for quick creation
          </p>
        </div>
        {isAdmin && (
          <TemplateFormDialog
            trigger={
              <Button data-testid="create-template-button">
                <Plus className="mr-2 h-4 w-4" />
                Add Template
              </Button>
            }
          />
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-center text-destructive py-8">
          Failed to load templates.
        </div>
      ) : (
        <TemplatesTable templates={templatesWithActions ?? []} />
      )}

      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Template"
        description={`Are you sure you want to delete template "${deleteTarget?.slug}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
