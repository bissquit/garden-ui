/**
 * Past Events E2E Tests
 *
 * Group F: Creating already-resolved events in the past
 */

import { test, expect, uniqueSlug } from './fixtures';

test.describe('Past Events', () => {
  /**
   * F1: Create resolved incident in the past
   *
   * Setup:
   * - Service api-gateway (operational)
   *
   * Action:
   * {
   *   "title": "Past incident",
   *   "type": "incident",
   *   "status": "resolved",
   *   "severity": "minor",
   *   "description": "Already resolved",
   *   "started_at": "2024-01-10T10:00:00Z",
   *   "resolved_at": "2024-01-10T12:00:00Z",
   *   "affected_services": [
   *     {"service_id": "<api-gateway-id>", "status": "degraded"}
   *   ]
   * }
   *
   * Expected Result:
   * 1. Incident created with status = "resolved"
   * 2. api-gateway:
   *    - effective_status = "operational" (event is already closed)
   *    - has_active_events = false
   * 3. Incident appears in service's event history
   */
  test.describe('F1: Create resolved incident in the past', () => {
    test('service status unchanged for past event', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      // Verify initial status
      let apiService = await api.getService(svc1.slug);
      expect(apiService.effective_status).toBe('operational');

      // Action: Create past incident (already resolved)
      const pastStart = new Date('2024-01-10T10:00:00Z');
      const pastEnd = new Date('2024-01-10T12:00:00Z');

      const { id: eventId, status } = await api.createEvent({
        title: 'Past incident',
        type: 'incident',
        status: 'resolved',
        severity: 'minor',
        description: 'Already resolved',
        started_at: pastStart.toISOString(),
        resolved_at: pastEnd.toISOString(),
        affected_services: [{ service_id: svc1.id, status: 'degraded' }],
      });

      expect(status).toBe(201);

      // Assertions
      const event = await api.getEvent(eventId);
      expect(event?.status).toBe('resolved');
      expect(event?.resolved_at).not.toBeNull();

      // Service status should NOT change (event was already resolved)
      apiService = await api.getService(svc1.slug);
      expect(apiService.effective_status).toBe('operational');
      expect(apiService.has_active_events).toBe(false);

      // Event should appear in service events
      const events = await api.getServiceEvents(svc1.slug);
      expect(events.events.some(e => e.id === eventId)).toBe(true);
    });
  });

  /**
   * F2: Past incident does not affect current manual status
   *
   * Setup:
   * - Service api-gateway: stored_status = "degraded" (manual)
   *
   * Action:
   * Create resolved incident in the past
   *
   * Expected Result:
   * - stored_status remains "degraded"
   * - effective_status = "degraded"
   * - Past incident does NOT reset to operational (it was created already closed)
   */
  test.describe('F2: Past incident does not affect current manual status', () => {
    test('manual status preserved after past incident creation', async ({ api }) => {
      // Setup: Service with manual degraded status
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      await api.updateService(svc1.slug, {
        name: svc1.slug,
        slug: svc1.slug,
        status: 'degraded',
        reason: 'Manual testing',
      });

      let apiService = await api.getService(svc1.slug);
      expect(apiService.status).toBe('degraded');
      expect(apiService.effective_status).toBe('degraded');

      // Action: Create resolved incident in the past
      const pastStart = new Date('2024-01-10T10:00:00Z');
      const pastEnd = new Date('2024-01-10T12:00:00Z');

      const { status } = await api.createEvent({
        title: 'Past incident',
        type: 'incident',
        status: 'resolved',
        severity: 'major',
        description: 'Already resolved',
        started_at: pastStart.toISOString(),
        resolved_at: pastEnd.toISOString(),
        affected_services: [{ service_id: svc1.id, status: 'major_outage' }],
      });

      expect(status).toBe(201);

      // Assertions: Manual status should be preserved
      apiService = await api.getService(svc1.slug);
      expect(apiService.status).toBe('degraded'); // NOT reset to operational
      expect(apiService.effective_status).toBe('degraded');
    });
  });
});
