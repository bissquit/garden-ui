import { z } from 'zod';
import { serviceStatusEnum } from './service';

export const eventTypeEnum = z.enum(['incident', 'maintenance']);
export const eventStatusEnum = z.enum([
  'investigating',
  'identified',
  'monitoring',
  'resolved',
  'scheduled',
  'in_progress',
  'completed',
]);
export const severityEnum = z.enum(['minor', 'major', 'critical']);

// Schema for service with status
export const affectedServiceSchema = z.object({
  service_id: z.string().uuid(),
  status: serviceStatusEnum,
});

export type AffectedServiceInput = z.infer<typeof affectedServiceSchema>;

// Schema for group with status
export const affectedGroupSchema = z.object({
  group_id: z.string().uuid(),
  status: serviceStatusEnum,
});

export type AffectedGroupInput = z.infer<typeof affectedGroupSchema>;

export const createEventSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    type: eventTypeEnum,
    status: eventStatusEnum,
    severity: severityEnum.optional(),
    description: z.string().min(1, 'Description is required'),
    started_at: z.string().datetime().optional(),
    resolved_at: z.string().datetime().optional(),
    scheduled_start_at: z.string().datetime().optional(),
    scheduled_end_at: z.string().datetime().optional(),
    notify_subscribers: z.boolean().default(false),
    template_id: z.string().uuid().optional(),
    // Affected services and groups with statuses
    affected_services: z.array(affectedServiceSchema).optional().default([]),
    affected_groups: z.array(affectedGroupSchema).optional().default([]),
  })
  .refine(
    (data) => {
      // Severity is required for incidents
      if (data.type === 'incident' && !data.severity) {
        return false;
      }
      return true;
    },
    {
      message: 'Severity is required for incidents',
      path: ['severity'],
    }
  )
  .refine(
    (data) => {
      // Status must match event type
      const incidentStatuses = ['investigating', 'identified', 'monitoring', 'resolved'];
      const maintenanceStatuses = ['scheduled', 'in_progress', 'completed'];

      if (data.type === 'incident' && !incidentStatuses.includes(data.status)) {
        return false;
      }
      if (data.type === 'maintenance' && !maintenanceStatuses.includes(data.status)) {
        return false;
      }
      return true;
    },
    {
      message: 'Status must match event type',
      path: ['status'],
    }
  );

export const addEventUpdateSchema = z.object({
  status: eventStatusEnum,
  message: z.string().min(1, 'Message is required'),
  notify_subscribers: z.boolean().default(false),
  // New: service management within updates
  service_updates: z.array(affectedServiceSchema).optional(),
  add_services: z.array(affectedServiceSchema).optional(),
  add_groups: z.array(affectedGroupSchema).optional(),
  remove_service_ids: z.array(z.string().uuid()).optional(),
  reason: z.string().optional(),
});

export type CreateEventFormData = z.infer<typeof createEventSchema>;
export type AddEventUpdateFormData = z.infer<typeof addEventUpdateSchema>;
