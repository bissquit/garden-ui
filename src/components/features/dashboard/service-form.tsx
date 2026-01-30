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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import {
  createServiceSchema,
  updateServiceSchema,
  type CreateServiceFormData,
  type UpdateServiceFormData,
} from '@/lib/validations/service';
import { serviceStatusConfig } from '@/lib/status-utils';
import type { components } from '@/api/types.generated';

type Service = components['schemas']['Service'];
type ServiceGroup = components['schemas']['ServiceGroup'];

interface ServiceFormProps {
  service?: Service;
  groups: ServiceGroup[];
  onSubmit: (data: CreateServiceFormData | UpdateServiceFormData) => void;
  isLoading?: boolean;
}

export function ServiceForm({ service, groups, onSubmit, isLoading }: ServiceFormProps) {
  const isEditing = !!service;
  const form = useForm<CreateServiceFormData | UpdateServiceFormData>({
    resolver: zodResolver(isEditing ? updateServiceSchema : createServiceSchema),
    defaultValues: isEditing
      ? {
          name: service.name,
          slug: service.slug,
          description: service.description ?? '',
          status: service.status,
          group_ids: service.group_ids ?? [],
          order: service.order ?? 0,
        }
      : {
          name: '',
          slug: '',
          description: '',
          group_ids: [],
          order: 0,
        },
  });

  // Auto-generate slug from name
  const watchName = form.watch('name');
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name);

    // Only auto-generate slug if it's empty or matches the previous auto-generated value
    const currentSlug = form.getValues('slug');
    if (!service && (!currentSlug || currentSlug === generateSlug(watchName))) {
      form.setValue('slug', generateSlug(name));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={handleNameChange}
                  placeholder="My Service"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input {...field} placeholder="my-service" />
              </FormControl>
              <FormDescription>
                URL-friendly identifier (lowercase, hyphens only)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Service description..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status{!isEditing && ' (optional)'}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(serviceStatusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="group_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Groups (optional)</FormLabel>
              <FormDescription>
                Select one or more groups for this service
              </FormDescription>
              <div className="space-y-2 mt-2">
                {groups.length > 0 ? (
                  groups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`group-${group.id}`}
                        checked={field.value?.includes(group.id)}
                        onCheckedChange={(checked) => {
                          const current = field.value ?? [];
                          if (checked) {
                            field.onChange([...current, group.id]);
                          } else {
                            field.onChange(current.filter((id) => id !== group.id));
                          }
                        }}
                      />
                      <label
                        htmlFor={`group-${group.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {group.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No groups available</p>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Order</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>Lower numbers appear first</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {service ? 'Update Service' : 'Create Service'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
