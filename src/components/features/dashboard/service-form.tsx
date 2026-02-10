'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Plus, X } from 'lucide-react';
import {
  createServiceSchema,
  updateServiceSchema,
  type CreateServiceFormData,
  type UpdateServiceFormData,
} from '@/lib/validations/service';
import { serviceStatusConfig } from '@/lib/status-utils';
import { ActiveEventsWarning } from './active-events-warning';
import type { components } from '@/api/types.generated';

type Service = components['schemas']['Service'];
type ServiceGroup = components['schemas']['ServiceGroup'];

interface ServiceFormProps {
  service?: Service;
  groups: ServiceGroup[];
  initialTags?: Record<string, string>;
  onSubmit: (data: CreateServiceFormData | UpdateServiceFormData, tags?: Record<string, string>) => void;
  isLoading?: boolean;
  hasActiveEvents?: boolean;
}

export function ServiceForm({ service, groups, initialTags, onSubmit, isLoading, hasActiveEvents }: ServiceFormProps) {
  const isEditing = !!service;

  // Tags state
  const [tags, setTags] = useState<Array<{ key: string; value: string }>>([]);
  const [newTagKey, setNewTagKey] = useState('');
  const [newTagValue, setNewTagValue] = useState('');

  // Sync tags state when initialTags loads
  useEffect(() => {
    if (initialTags) {
      setTags(Object.entries(initialTags).map(([key, value]) => ({ key, value })));
    }
  }, [initialTags]);

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

  const handleAddTag = () => {
    const key = newTagKey.trim();
    const value = newTagValue.trim();
    if (key && !tags.some((t) => t.key === key)) {
      setTags([...tags, { key, value }]);
      setNewTagKey('');
      setNewTagValue('');
    }
  };

  const handleRemoveTag = (key: string) => {
    setTags(tags.filter((t) => t.key !== key));
  };

  const handleFormSubmit = (data: CreateServiceFormData | UpdateServiceFormData) => {
    const tagsObject: Record<string, string> = {};
    for (const tag of tags) {
      if (tag.key.trim()) {
        tagsObject[tag.key.trim()] = tag.value.trim();
      }
    }
    onSubmit(data, tagsObject);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        {hasActiveEvents && <ActiveEventsWarning />}

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
              <FormLabel>
                Status{!isEditing && ' (optional)'}
                {hasActiveEvents && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    (stored value)
                  </span>
                )}
              </FormLabel>
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
              {hasActiveEvents && (
                <FormDescription>
                  This is the stored status. The effective status is currently
                  determined by active events.
                </FormDescription>
              )}
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
                        data-testid="group-checkbox"
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

        {/* Tags section */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Tags (optional)</label>
          <p className="text-sm text-muted-foreground">Key-value metadata for the service</p>

          {tags.length > 0 && (
            <div className="space-y-2 mt-2">
              {tags.map((tag) => (
                <div key={tag.key} className="flex items-center gap-2">
                  <div className="flex-1 text-sm bg-muted px-3 py-2 rounded-md">
                    <span className="font-medium">{tag.key}</span>
                    <span className="text-muted-foreground">: {tag.value}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTag(tag.key)}
                    className="shrink-0 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <Input
              placeholder="Key"
              value={newTagKey}
              onChange={(e) => setNewTagKey(e.target.value)}
              className="flex-1"
              data-testid="tag-key-input"
            />
            <Input
              placeholder="Value"
              value={newTagValue}
              onChange={(e) => setNewTagValue(e.target.value)}
              className="flex-1"
              data-testid="tag-value-input"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddTag}
              disabled={!newTagKey.trim()}
              className="shrink-0"
              data-testid="add-tag-button"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

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
