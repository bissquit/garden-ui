'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import {
  createTemplateSchema,
  type CreateTemplateFormData,
} from '@/lib/validations/template';

interface TemplateFormProps {
  onSubmit: (data: CreateTemplateFormData) => void;
  isLoading?: boolean;
}

export function TemplateForm({ onSubmit, isLoading }: TemplateFormProps) {
  const form = useForm<CreateTemplateFormData>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      slug: '',
      type: 'incident',
      title_template: '',
      body_template: '',
    },
  });

  // Auto-generate slug from title template
  const watchTitle = form.watch('title_template');
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setValue('title_template', title);

    // Only auto-generate slug if it's empty or matches the previous auto-generated value
    const currentSlug = form.getValues('slug');
    if (!currentSlug || currentSlug === generateSlug(watchTitle)) {
      form.setValue('slug', generateSlug(title));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input {...field} placeholder="database-maintenance" />
              </FormControl>
              <FormDescription>
                URL-friendly identifier (lowercase, numbers, hyphens only)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title_template"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title Template</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={handleTitleChange}
                  placeholder="Database Maintenance"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="body_template"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body Template</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Scheduled maintenance for database upgrades..."
                  rows={4}
                />
              </FormControl>
              <FormDescription>
                Template text for the event body
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Template
          </Button>
        </div>
      </form>
    </Form>
  );
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
