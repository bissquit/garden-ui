'use client';

import { useState, useEffect } from 'react';
import { useServiceTags, useUpdateServiceTags } from '@/hooks/use-service-tags';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, X, Save, Tag } from 'lucide-react';

interface ServiceTagsEditorProps {
  slug: string;
}

interface TagEntry {
  key: string;
  value: string;
}

export function ServiceTagsEditor({ slug }: ServiceTagsEditorProps) {
  const { data: tagsData, isLoading, isError } = useServiceTags(slug);
  const updateMutation = useUpdateServiceTags();
  const { toast } = useToast();

  const [tags, setTags] = useState<TagEntry[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize tags from server data
  useEffect(() => {
    if (tagsData) {
      const entries = Object.entries(tagsData).map(([key, value]) => ({
        key,
        value,
      }));
      setTags(entries);
      setHasChanges(false);
    }
  }, [tagsData]);

  const handleAddTag = () => {
    setTags([...tags, { key: '', value: '' }]);
    setHasChanges(true);
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleKeyChange = (index: number, key: string) => {
    const newTags = [...tags];
    newTags[index] = { ...newTags[index], key };
    setTags(newTags);
    setHasChanges(true);
  };

  const handleValueChange = (index: number, value: string) => {
    const newTags = [...tags];
    newTags[index] = { ...newTags[index], value };
    setTags(newTags);
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Filter out empty tags and convert to object
    const tagsObject: Record<string, string> = {};
    for (const tag of tags) {
      if (tag.key.trim()) {
        tagsObject[tag.key.trim()] = tag.value.trim();
      }
    }

    try {
      await updateMutation.mutateAsync({ slug, tags: tagsObject });
      toast({ title: 'Tags updated successfully' });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: 'Failed to update tags',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive py-4">
            Failed to load tags.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Tags
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags defined.</p>
        ) : (
          <div className="space-y-2">
            {tags.map((tag, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={tag.key}
                  onChange={(e) => handleKeyChange(index, e.target.value)}
                  placeholder="Key"
                  className="flex-1"
                />
                <Input
                  value={tag.value}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  placeholder="Value"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTag(index)}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddTag}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Tag
          </Button>
          {hasChanges && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="gap-1"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
