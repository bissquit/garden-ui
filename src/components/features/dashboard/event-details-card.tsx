'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Wrench, Clock, Calendar } from 'lucide-react';
import { severityConfig, eventStatusConfig, formatEventDate } from '@/lib/status-utils';
import { cn } from '@/lib/utils';
import type { components } from '@/api/types.generated';

type Event = components['schemas']['Event'];

interface EventDetailsCardProps {
  event: Event;
}

export function EventDetailsCard({ event }: EventDetailsCardProps) {
  const statusConfig = eventStatusConfig[event.status];
  const isIncident = event.type === 'incident';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {isIncident ? (
              <AlertCircle className="h-6 w-6 text-red-500" />
            ) : (
              <Wrench className="h-6 w-6 text-blue-500" />
            )}
            <div>
              <CardTitle>{event.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={isIncident ? 'destructive' : 'secondary'}>
                  {event.type}
                </Badge>
                {event.severity && (
                  <Badge
                    className={cn(
                      severityConfig[event.severity].bgClass,
                      'text-white'
                    )}
                  >
                    {severityConfig[event.severity].label}
                  </Badge>
                )}
                <Badge variant="outline">{statusConfig.label}</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        <div>
          <h4 className="text-sm font-medium mb-1">Description</h4>
          <p className="text-muted-foreground">{event.description}</p>
        </div>

        {/* Timestamps */}
        <div className="grid gap-4 md:grid-cols-2">
          {event.started_at && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Started</div>
                <div className="text-sm text-muted-foreground">
                  {formatEventDate(event.started_at)}
                </div>
              </div>
            </div>
          )}

          {event.resolved_at && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Resolved</div>
                <div className="text-sm text-muted-foreground">
                  {formatEventDate(event.resolved_at)}
                </div>
              </div>
            </div>
          )}

          {event.scheduled_start_at && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Scheduled Start</div>
                <div className="text-sm text-muted-foreground">
                  {formatEventDate(event.scheduled_start_at)}
                </div>
              </div>
            </div>
          )}

          {event.scheduled_end_at && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Scheduled End</div>
                <div className="text-sm text-muted-foreground">
                  {formatEventDate(event.scheduled_end_at)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="pt-4 border-t text-sm text-muted-foreground">
          <div>Created: {formatEventDate(event.created_at)}</div>
          <div>Last updated: {formatEventDate(event.updated_at)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
