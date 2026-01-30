'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Wrench, Clock, Calendar, Server } from 'lucide-react';
import { severityConfig, eventStatusConfig, formatEventDate } from '@/lib/status-utils';
import { cn } from '@/lib/utils';
import type { components } from '@/api/types.generated';

type Event = components['schemas']['Event'];
type Service = components['schemas']['Service'];

interface EventDetailsCardProps {
  event: Event;
  services?: Service[];
}

export function EventDetailsCard({ event, services = [] }: EventDetailsCardProps) {
  const statusConfig = eventStatusConfig[event.status];
  const isIncident = event.type === 'incident';

  // Фильтруем затронутые сервисы
  const affectedServices = services.filter(
    (s) => event.service_ids?.includes(s.id)
  );

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

        {/* Affected Services */}
        {affectedServices.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Server className="h-4 w-4" />
              Affected Services
            </h4>
            <div className="flex flex-wrap gap-2">
              {affectedServices.map((service) => (
                <Badge key={service.id} variant="outline">
                  {service.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {event.service_ids && event.service_ids.length > 0 && affectedServices.length === 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Server className="h-4 w-4" />
              Affected Services
            </h4>
            <p className="text-sm text-muted-foreground">
              {event.service_ids.length} service(s) affected
            </p>
          </div>
        )}

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
