import type { components } from '@/api/types.generated';

type ServiceStatus = components['schemas']['ServiceStatus'];
type AffectedService = components['schemas']['AffectedService'];
type AffectedGroup = components['schemas']['AffectedGroup'];

/**
 * Convert legacy service_ids array to AffectedService array with default status.
 * Used for backward compatibility with existing forms.
 */
export function convertLegacyToAffectedServices(
  serviceIds: string[],
  defaultStatus: ServiceStatus = 'degraded'
): AffectedService[] {
  return serviceIds.map((id) => ({ service_id: id, status: defaultStatus }));
}

/**
 * Convert legacy group_ids array to AffectedGroup array with default status.
 * Used for backward compatibility with existing forms.
 */
export function convertLegacyToAffectedGroups(
  groupIds: string[],
  defaultStatus: ServiceStatus = 'degraded'
): AffectedGroup[] {
  return groupIds.map((id) => ({ group_id: id, status: defaultStatus }));
}
